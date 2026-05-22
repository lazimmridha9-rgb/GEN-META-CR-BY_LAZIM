const { ipcMain, shell, app } = require('electron');
const { exec } = require('child_process');
const { logStartup } = require('../utils/logStartup');
const { checkApiStatus } = require('../services/authService');

/**
 * Registers application-related IPC handlers
 */
function registerAppHandlers() {
  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });

  ipcMain.handle('api-status-check', async () => {
    logStartup('API status check triggered from renderer');
    try {
      const status = await checkApiStatus(true);
      return status;
    } catch (error) {
      logStartup(`Error in api-status-check handler: ${error.message}`);
      return { status: 'error', error: error.message };
    }
  });

  ipcMain.handle('open-external', async (event, url) => {
    try {
      await shell.openExternal(url);
      return { success: true };
    } catch (error) {
      // On Windows, try fallback with cmd start when default browser is not set
      if (process.platform === 'win32') {
        try {
          await new Promise((resolve, reject) => {
            exec(`start "" "${url}"`, (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
          return { success: true };
        } catch (fallbackError) {
          logStartup(`Fallback open also failed: ${fallbackError.message}`);
        }
      }
      return { success: false, error: `Could not open browser. Please set a default browser in your system settings. (${error.message})` };
    }
  });

  ipcMain.handle('is-development', () => {
    return !app.isPackaged;
  });
}

module.exports = { registerAppHandlers };
