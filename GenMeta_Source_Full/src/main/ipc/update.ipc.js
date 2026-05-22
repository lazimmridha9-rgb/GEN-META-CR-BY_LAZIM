const { ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const { logStartup } = require('../../utils/logStartup');
const { checkForUpdates } = require('../../services/updateService');

/**
 * Registers update-related IPC handlers
 */
function registerUpdateHandlers() {
  ipcMain.handle('check-for-updates', () => {
    logStartup('Manual check for updates triggered');
    checkForUpdates();
    return { success: true };
  });

  ipcMain.handle('download-update', () => {
    logStartup('Starting update download');
    autoUpdater.downloadUpdate().catch((err) => {
      logStartup(`Error downloading update: ${err.message}`);
      return { success: false, error: err.message };
    });
    return { success: true };
  });

  ipcMain.handle('install-update', () => {
    logStartup('Installing update');
    autoUpdater.quitAndInstall(false, true);
    return { success: true };
  });
}

module.exports = { registerUpdateHandlers };
