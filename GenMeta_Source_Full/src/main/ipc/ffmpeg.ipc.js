const { ipcMain } = require('electron');

/**
 * Registers FFmpeg-related IPC handlers
 */
function registerFFmpegHandlers() {
  ipcMain.handle('test-ffmpeg', async () => {
    try {
      const { testFFmpegInstallation } = require('../../modules/media/video/compressor');
      const result = await testFFmpegInstallation();
      return result;
    } catch (error) {
      console.error('Error testing FFmpeg:', error);
      return {
        success: false,
        message: 'Failed to test FFmpeg installation',
        error: error.message,
      };
    }
  });
}

module.exports = { registerFFmpegHandlers };
