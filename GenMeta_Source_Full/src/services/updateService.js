// Node modules
const { app } = require("electron");
const { autoUpdater } = require("electron-updater");
const autoUpdaterLogger = require("electron-log");

// Local utils
const { logStartup } = require("../utils/logStartup");

/**
 * Sends update status information to the renderer process via IPC.
 *
 * @param {string} status - The current update status.
 * @param {Object} [data={}] - Additional data to include.
 */
function sendUpdateStatusToWindow(status, data = {}) {
  if (global.mainWindow && !global.mainWindow.isDestroyed()) {
    global.mainWindow.webContents.send("update-status", {
      status,
      ...data,
      currentVersion: app.getVersion(),
    });
  }
}

/**
 * Triggers a check for available updates.
 */
function checkForUpdates() {
  logStartup("Checking for updates...");
  autoUpdater.checkForUpdates().catch((err) => {
    logStartup(`Error checking for updates: ${err.message}`);
  });
}

/**
 * Configures and sets up the auto-updater with event listeners.
 */
function setupAutoUpdater() {
  // Configure logger
  autoUpdater.logger = autoUpdaterLogger;
  autoUpdater.logger.transports.file.level = "info";

  // Auto-updater settings
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowDowngrade = false;
  autoUpdater.forceDevUpdateConfig = true;

  // Set the GitHub release feed
  autoUpdater.setFeedURL({
    provider: "github",
    owner: "aminurdev",
    repo: "genmeta-app",
    private: false,
    vPrefixedTagName: true,
    releaseType: "release",
  });

  // Event: Checking for update
  autoUpdater.on("checking-for-update", () => {
    logStartup("Checking for update...");
    sendUpdateStatusToWindow("checking");
  });

  // Event: Update available
  autoUpdater.on("update-available", (info) => {
    logStartup(`Update available: ${JSON.stringify(info)}`);
    sendUpdateStatusToWindow("available", {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes,
    });
  });

  // Event: Update not available
  autoUpdater.on("update-not-available", (info) => {
    logStartup(`Update not available. Current version: ${info.version}`);
    sendUpdateStatusToWindow("not-available", {
      currentVersion: app.getVersion(),
      message: "You are using the latest version of the application!",
    });
  });

  // Event: Error
  autoUpdater.on("error", (err) => {
    logStartup(`Update error: ${err.message}`);
    sendUpdateStatusToWindow("error", { error: err.message });
  });

  // Event: Download progress
  autoUpdater.on("download-progress", (progressObj) => {
    logStartup(
      `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}%`
    );
    sendUpdateStatusToWindow("downloading", {
      percent: progressObj.percent,
      bytesPerSecond: progressObj.bytesPerSecond,
      transferred: progressObj.transferred,
      total: progressObj.total,
    });
  });

  // Event: Update downloaded
  autoUpdater.on("update-downloaded", (info) => {
    logStartup(`Update downloaded. Version: ${info.version}`);
    sendUpdateStatusToWindow("downloaded", { version: info.version });
  });
}

module.exports = {
  setupAutoUpdater,
  checkForUpdates,
  sendUpdateStatusToWindow,
};
