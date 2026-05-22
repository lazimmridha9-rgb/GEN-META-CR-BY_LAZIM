const { contextBridge, ipcRenderer, webUtils } = require("electron");

// =============================================================================
// Safe IPC invocation wrapper
// =============================================================================

/**
 * Safely invoke an IPC channel with error handling.
 *
 * @param {string} channel - The IPC channel to invoke.
 * @param {...any} args - Arguments to pass to the channel handler.
 * @returns {Promise<any>} Resolves with the result or rejects with an error.
 */
const invokeIPC = async (channel, ...args) => {
  try {
    return await ipcRenderer.invoke(channel, ...args);
  } catch (error) {
    console.error(`Error invoking ${channel}:`, error);
    throw error;
  }
};

// =============================================================================
// Safe IPC event listener wrapper
// =============================================================================

/**
 * Create a safe IPC event listener with error handling and data sanitization.
 *
 * @param {string} channel - The IPC channel to listen on.
 * @param {Function} callback - Callback invoked when the event fires.
 * @returns {Function} A cleanup function to remove the listener.
 */
const listenToIPC = (channel, callback) => {
  /**
   * Wrapped callback with error handling and optional data sanitization.
   *
   * @param {Event} event - The IPC event object.
   * @param {...any} args - Event payload arguments.
   */
  const wrappedCallback = (event, ...args) => {
    // Special sanitization for update-status to prevent data leakage
    if (channel === "update-status" && args.length > 0) {
      const data = args[0];

      // Build a clean data object with only essential properties
      const cleanData = {
        status: data && typeof data.status === "string" ? data.status : "unknown",
        currentVersion: data && typeof data.currentVersion === "string" ? data.currentVersion : "",
      };

      // Add version-specific properties based on status
      if (data && data.status === "available" && typeof data.version === "string") {
        cleanData.version = data.version;
        cleanData.releaseDate = data.releaseDate;
        cleanData.releaseNotes = data.releaseNotes;
      }

      if (data && data.status === "downloading" && typeof data.percent === "number") {
        cleanData.percent = Math.round(Math.max(0, Math.min(100, data.percent)));
      }

      if (data && data.status === "downloaded" && typeof data.version === "string") {
        cleanData.version = data.version;
      }

      if (data && data.status === "error") {
        cleanData.error = typeof data.error === "string" ? data.error : "Unknown error";
      }

      try {
        callback(cleanData);
      } catch (error) {
        console.error(`Error in ${channel} listener:`, error);
      }
      return;
    }

    // Default path: forward arguments to the callback
    try {
      callback(...args);
    } catch (error) {
      console.error(`Error in ${channel} listener:`, error);
    }
  };

  ipcRenderer.on(channel, wrappedCallback);

  // Return a cleanup function to remove the listener
  return () => {
    ipcRenderer.removeListener(channel, wrappedCallback);
  };
};

// =============================================================================
// Exposed API (via contextBridge)
// =============================================================================

const api = {
  /**
   * Generic IPC invoke method for arbitrary channels.
   *
   * @param {string} channel - IPC channel name.
   * @param {...any} args - Arguments to pass.
   * @returns {Promise<any>}
   */
  invoke: (channel, ...args) => invokeIPC(channel, ...args),

  // ---------------------------------------------------------------------------
  // File system operations
  // ---------------------------------------------------------------------------
  files: {
    selectPath: () => invokeIPC("select-path"),
    selectImages: () => invokeIPC("select-images"),
    openOutputDirectory: (path) => invokeIPC("open-output-directory", path),
    exportCsv: (data, outputDirectory, newExtension, selectedPlatform) =>
      invokeIPC("export-csv", data, outputDirectory, newExtension, selectedPlatform),
    processDroppedFiles: (droppedPaths) => invokeIPC("process-dropped-files", droppedPaths),
    getFolderPreview: (folderPath) => invokeIPC("get-folder-preview", folderPath),
    getPathForFile: (file) => {
      try {
        return webUtils.getPathForFile(file);
      } catch (error) {
        console.error("Error getting path for file:", error);
        return null;
      }
    },
  },

  // ---------------------------------------------------------------------------
  // Authentication operations
  // ---------------------------------------------------------------------------
  auth: {
    checkLoginStatus: () => invokeIPC("check-login-status"),
    login: (credentials) => invokeIPC("login", credentials),
    loginWithGoogle: () => invokeIPC("google-login"),
    loginAsGuest: () => invokeIPC("guest-login"),
    logout: () => invokeIPC("logout"),
    logoutGuest: () => invokeIPC("guest-logout"),
    checkGuestSession: () => invokeIPC("check-guest-session"),
    getGuestInfo: () => invokeIPC("get-guest-info"),
    onGoogleAuthComplete: (callback) => listenToIPC("google-auth-complete", callback),
  },

  // ---------------------------------------------------------------------------
  // Settings operations
  // ---------------------------------------------------------------------------
  settings: {
    save: (settings) => invokeIPC("save-settings", settings),
    load: () => invokeIPC("load-settings"),
    checkGsInstalled: () => invokeIPC("check-gs-installed"),
    findGsPath: () => invokeIPC("find-gs-path"),
    installGhostscript: () => invokeIPC("install-ghostscript"),
    onGhostscriptDownloadProgress: (callback) =>
      listenToIPC("ghostscript-download-progress", callback),
    onGhostscriptInstallProgress: (callback) =>
      listenToIPC("ghostscript-install-progress", callback),
    onGhostscriptInstallDetected: (callback) =>
      listenToIPC("ghostscript-install-detected", callback),
  },

  // ---------------------------------------------------------------------------
  // Processing operations
  // ---------------------------------------------------------------------------
  processing: {
    submit: (config) => invokeIPC("submit-config", config),
    onStart: (callback) => listenToIPC("processing-start", callback),
    onProgress: (callback) => listenToIPC("processing-progress", callback),
    onResults: (callback) => listenToIPC("processing-results", callback),
    onError: (callback) => listenToIPC("processing-error", callback),
    onResultItem: (callback) => listenToIPC("processing-result-item", callback),
    onStopped: (callback) => listenToIPC("processing-stopped", callback),
    saveMetadata: (data) => invokeIPC("save-metadata", data),
    stopProcessing: () => invokeIPC("processing:stop"),
    updateCredit: (callback) => listenToIPC("update-credit", callback),
    renameFiles: (data) => invokeIPC("rename-files", data),
    regenerateMetadata: (config) => invokeIPC("processing:regenerate-metadata", config),
  },

  // ---------------------------------------------------------------------------
  // Application operations
  // ---------------------------------------------------------------------------
  app: {
    onMessage: (callback) => listenToIPC("message", callback),
    getVersion: () => invokeIPC("get-app-version"),
    onApiStatusUpdate: (callback) => listenToIPC("api-status-update", callback),
    onLoginStatus: (callback) => listenToIPC("login-status", callback),
    checkApiStatus: () => invokeIPC("api-status-check"),
    isDevelopment: () => invokeIPC("is-development"),
  },

  // ---------------------------------------------------------------------------
  // Update operations
  // ---------------------------------------------------------------------------
  updates: {
    onUpdateStatus: (callback) => listenToIPC("update-status", callback),
    checkForUpdates: () => invokeIPC("check-for-updates"),
    downloadUpdate: () => invokeIPC("download-update"),
    installUpdate: () => invokeIPC("install-update"),
  },

  // ---------------------------------------------------------------------------
  // External link handling
  // ---------------------------------------------------------------------------
  openExternal: (url) => invokeIPC("open-external", url),

  // ---------------------------------------------------------------------------
  // Listener cleanup helper
  // ---------------------------------------------------------------------------
  cleanup: {
    /**
     * Remove IPC listeners for specified channels or all processing-related channels.
     *
     * @param {string|string[]} [channels] - Channel name(s) to clear, or omit to clear defaults.
     */
    removeListeners: (channels) => {
      if (Array.isArray(channels)) {
        channels.forEach((channel) => ipcRenderer.removeAllListeners(channel));
      } else if (typeof channels === "string") {
        ipcRenderer.removeAllListeners(channels);
      } else {
        [
          "processing-start",
          "processing-progress",
          "processing-results",
          "processing-result-item",
          "processing-error",
          "message",
          "api-status-update",
          "update-credit",
        ].forEach((channel) => ipcRenderer.removeAllListeners(channel));
      }
    },
  },
};

// Expose the API to the renderer process securely
contextBridge.exposeInMainWorld("electronAPI", api);
