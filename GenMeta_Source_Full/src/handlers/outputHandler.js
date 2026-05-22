const { ipcMain, shell } = require('electron');
const fs = require('fs');

/**
 * Registers output directory IPC handlers
 */
function registerOutputHandler() {
  ipcMain.handle('open-output-directory', async (event, directoryPath) => {
    try {
      if (directoryPath && fs.existsSync(directoryPath)) {
        await shell.openPath(directoryPath);
        return { success: true };
      }
      return { success: false, message: 'Directory does not exist' };
    } catch (error) {
      console.error('Error opening directory:', error);
      return { success: false, message: error.message };
    }
  });
}

module.exports = { registerOutputHandler };
