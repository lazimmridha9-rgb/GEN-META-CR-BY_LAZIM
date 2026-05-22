const { app } = require('electron');
const { autoUpdater } = require('electron-updater');
const autoUpdaterLogger = require('electron-log');
const { logStartup } = require('../../utils/logStartup');

/**
 * Sends update status to the renderer process
 * @param {string} status - Update status string
 * @param {Object} data - Additional status data
 */
function sendUpdateStatusToWindow(status, data = {}) {
  if (global.mainWindow && !global.mainWindow.isDestroyed()) {
    global.mainWindow.webContents.send('update-status', {
      status,
      ...data,
      currentVersion: app.getVersion(),
    });
  }
}

/**
 * Manually triggers an update check
 */
function checkForUpdates() {
  logStartup('Checking for updates...');
  autoUpdater.checkForUpdates().catch((err) => {
    logStartup(`Error checking for updates: ${err.message}`);
  });
}

/**
 * Configures and sets up the auto-updater with all event listeners
 */
function setupAutoUpdater() {
  autoUpdater.logger = autoUpdaterLogger;
  autoUpdater.logger.transports.file.level = 'info';
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowDowngrade = false;
  autoUpdater.forceDevUpdateConfig = true;

  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'aminurdev',
    repo: 'genmeta-app',
    private: false,
    vPrefixedTagName: true,
    releaseType: 'release',
  });

  autoUpdater.on('checking-for-update', () => {
    logStartup('Checking for update...');
    sendUpdateStatusToWindow('checking');
  });

  autoUpdater.on('update-available', (info) => {
    logStartup(`Update available: ${JSON.stringify(info)}`);
    sendUpdateStatusToWindow('available', {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes,
    });
  });

  autoUpdater.on('update-not-available', (info) => {
    logStartup(`Update not available. Current version: ${info.version}`);
    sendUpdateStatusToWindow('not-available', {
      currentVersion: app.getVersion(),
      message: 'You are using the latest version of the application!',
    });
  });

  autoUpdater.on('error', (err) => {
    logStartup(`Update error: ${err.message}`);
    sendUpdateStatusToWindow('error', { error: err.message });
  });

  autoUpdater.on('download-progress', (progressObj) => {
    logStartup(`Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}%`);
    sendUpdateStatusToWindow('downloading', {
      percent: progressObj.percent,
      bytesPerSecond: progressObj.bytesPerSecond,
      transferred: progressObj.transferred,
      total: progressObj.total,
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    logStartup(`Update downloaded. Version: ${info.version}`);
    sendUpdateStatusToWindow('downloaded', { version: info.version });
  });
}

module.exports = {
  setupAutoUpdater,
  checkForUpdates,
  sendUpdateStatusToWindow,
};
