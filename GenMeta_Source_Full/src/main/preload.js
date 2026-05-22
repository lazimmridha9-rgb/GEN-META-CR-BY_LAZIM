const { contextBridge, ipcRenderer, webUtils } = require('electron');

/**
 * Safely invokes an IPC channel with error handling
 * @param {string} channel - The IPC channel to call
 * @param {...any} args - Arguments to pass
 * @returns {Promise<any>} Result from the IPC handler
 */
const invokeIPC = async (channel, ...args) => {
  try {
    return await ipcRenderer.invoke(channel, ...args);
  } catch (error) {
    console.error(`Error invoking ${channel}:`, error);
    throw error;
  }
};

/**
 * Creates a safe IPC event listener with error handling
 * @param {string} channel - The IPC channel to listen to
 * @param {Function} callback - Callback function
 * @returns {Function} Function to remove the listener
 */
const listenToIPC = (channel, callback) => {
  const wrappedCallback = (event, ...args) => {
    // Special sanitization for update-status channel
    if (channel === 'update-status' && args.length > 0) {
      const data = args[0];
      const cleanData = {
        status: data && typeof data.status === 'string' ? data.status : 'unknown',
        currentVersion: data && typeof data.currentVersion === 'string' ? data.currentVersion : '',
      };

      // Add version info when available
      if (data && data.status === 'available' && typeof data.version === 'string') {
        cleanData.version = data.version;
        cleanData.releaseDate = data.releaseDate;
        cleanData.releaseNotes = data.releaseNotes;
      }

      // Sanitize download progress
      if (data && data.status === 'downloading' && typeof data.percent === 'number') {
        cleanData.percent = Math.round(Math.max(0, Math.min(100, data.percent)));
      }

      // Add version when downloaded
      if (data && data.status === 'downloaded' && typeof data.version === 'string') {
        cleanData.version = data.version;
      }

      // Sanitize error messages
      if (data && data.status === 'error') {
        cleanData.error = typeof data.error === 'string' ? data.error : 'Unknown error';
      }

      try {
        callback(cleanData);
      } catch (error) {
        console.error(`Error in ${channel} listener:`, error);
      }
      return;
    }

    // Standard callback for other channels
    try {
      callback(...args);
    } catch (error) {
      console.error(`Error in ${channel} listener:`, error);
    }
  };

  ipcRenderer.on(channel, wrappedCallback);
  return () => ipcRenderer.removeListener(channel, wrappedCallback);
};

// Expose protected APIs to the renderer process
const api = {
  // Generic IPC invoke
  invoke: (channel, ...args) => invokeIPC(channel, ...args),

  // File system operations
  files: {
    selectPath: () => invokeIPC('select-path'),
    selectImages: () => invokeIPC('select-images'),
    openOutputDirectory: (path) => invokeIPC('open-output-directory', path),
    exportCsv: (data, outputDirectory, newExtension, selectedPlatform) =>
      invokeIPC('export-csv', data, outputDirectory, newExtension, selectedPlatform),
    processDroppedFiles: (droppedPaths) => invokeIPC('process-dropped-files', droppedPaths),
    getFolderPreview: (folderPath) => invokeIPC('get-folder-preview', folderPath),
    getPathForFile: (file) => {
      try {
        return webUtils.getPathForFile(file);
      } catch (error) {
        console.error('Error getting path for file:', error);
        return null;
      }
    },
  },

  // Authentication
  auth: {
    checkLoginStatus: () => invokeIPC('check-login-status'),
    login: (credentials) => invokeIPC('login', credentials),
    loginWithGoogle: () => invokeIPC('google-login'),
    loginAsGuest: () => invokeIPC('guest-login'),
    logout: () => invokeIPC('logout'),
    logoutGuest: () => invokeIPC('guest-logout'),
    checkGuestSession: () => invokeIPC('check-guest-session'),
    getGuestInfo: () => invokeIPC('get-guest-info'),
    onGoogleAuthComplete: (callback) => listenToIPC('google-auth-complete', callback),
  },

  // Settings management
  settings: {
    save: (settings) => invokeIPC('save-settings', settings),
    load: () => invokeIPC('load-settings'),
    checkGsInstalled: () => invokeIPC('check-gs-installed'),
    findGsPath: () => invokeIPC('find-gs-path'),
    installGhostscript: () => invokeIPC('install-ghostscript'),
    onGhostscriptDownloadProgress: (callback) => listenToIPC('ghostscript-download-progress', callback),
    onGhostscriptInstallProgress: (callback) => listenToIPC('ghostscript-install-progress', callback),
    onGhostscriptInstallDetected: (callback) => listenToIPC('ghostscript-install-detected', callback),
  },

  // Processing operations
  processing: {
    submit: (config) => invokeIPC('submit-config', config),
    onStart: (callback) => listenToIPC('processing-start', callback),
    onProgress: (callback) => listenToIPC('processing-progress', callback),
    onResults: (callback) => listenToIPC('processing-results', callback),
    onError: (callback) => listenToIPC('processing-error', callback),
    onResultItem: (callback) => listenToIPC('processing-result-item', callback),
    onStopped: (callback) => listenToIPC('processing-stopped', callback),
    saveMetadata: (data) => invokeIPC('save-metadata', data),
    stopProcessing: () => invokeIPC('processing:stop'),
    updateCredit: (callback) => listenToIPC('update-credit', callback),
    renameFiles: (data) => invokeIPC('rename-files', data),
    regenerateMetadata: (config) => invokeIPC('processing:regenerate-metadata', config),
  },

  // Application events
  app: {
    onMessage: (callback) => listenToIPC('message', callback),
    getVersion: () => invokeIPC('get-app-version'),
    onApiStatusUpdate: (callback) => listenToIPC('api-status-update', callback),
    onLoginStatus: (callback) => listenToIPC('login-status', callback),
    checkApiStatus: () => invokeIPC('api-status-check'),
    isDevelopment: () => invokeIPC('is-development'),
  },

  // Update management
  updates: {
    onUpdateStatus: (callback) => listenToIPC('update-status', callback),
    checkForUpdates: () => invokeIPC('check-for-updates'),
    downloadUpdate: () => invokeIPC('download-update'),
    installUpdate: () => invokeIPC('install-update'),
  },

  // Open external URLs
  openExternal: (url) => invokeIPC('open-external', url),

  // Cleanup helpers
  cleanup: {
    removeListeners: (channels) => {
      if (Array.isArray(channels)) {
        channels.forEach((channel) => ipcRenderer.removeAllListeners(channel));
      } else if (typeof channels === 'string') {
        ipcRenderer.removeAllListeners(channels);
      } else {
        [
          'processing-start',
          'processing-progress',
          'processing-results',
          'processing-result-item',
          'processing-error',
          'message',
          'api-status-update',
          'update-credit',
        ].forEach((channel) => ipcRenderer.removeAllListeners(channel));
      }
    },
  },
};

contextBridge.exposeInMainWorld('electronAPI', api);
