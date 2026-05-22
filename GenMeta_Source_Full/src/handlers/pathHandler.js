const { ipcMain, dialog, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

/**
 * Counts supported media files in a directory
 * @param {string} directoryPath - Path to the directory to scan
 * @returns {Promise<number>} Number of supported media files found
 */
async function countImagesInDirectory(directoryPath) {
  try {
    const files = await fs.promises.readdir(directoryPath);
    const supportedExtensions = ['.jpg', '.jpeg', '.png', '.eps', '.svg', '.mp4', '.mov'];
    return files.filter((file) => supportedExtensions.includes(path.extname(file).toLowerCase())).length;
  } catch (err) {
    console.error('Error counting files:', err);
    return 0;
  }
}

/**
 * Registers file path selection IPC handlers
 */
function registerPathHandler() {
  // Select a directory and count media files
  ipcMain.handle('select-path', async (event) => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender);
      const { canceled, filePaths } = await dialog.showOpenDialog(win, {
        properties: ['openDirectory'],
        modal: true,
        title: 'Select a directory',
        buttonLabel: 'Select Directory',
        message: 'Select a directory to scan for files',
        filters: [
          {
            name: 'Files',
            extensions: ['jpg', 'jpeg', 'png', 'eps', 'svg', 'mp4', 'mov'],
          },
        ],
      });

      if (!canceled && filePaths.length > 0) {
        const selectedPath = filePaths[0];
        const imageCount = await countImagesInDirectory(selectedPath);
        return { path: selectedPath, imageCount };
      }
      return null;
    } catch (error) {
      console.error('Error selecting path:', error);
      return null;
    }
  });

  // Select multiple individual image files
  ipcMain.handle('select-images', async (event) => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender);
      const { canceled, filePaths } = await dialog.showOpenDialog(win, {
        properties: ['openFile', 'multiSelections'],
        buttonLabel: 'Select Files',
        modal: true,
        filters: [
          {
            name: 'Files',
            extensions: ['jpg', 'jpeg', 'png', 'eps', 'svg', 'mp4', 'mov', 'avi', 'mkv', 'webm'],
          },
        ],
        title: 'Select files',
        message: 'Select files to process',
      });

      if (!canceled && filePaths.length > 0) {
        const parentDir = path.dirname(filePaths[0]);
        const selectedFiles = filePaths.map((filePath) => ({
          filename: path.basename(filePath),
          path: filePath,
        }));

        return {
          path: parentDir,
          imageCount: filePaths.length,
          selectedFiles,
        };
      }
      return null;
    } catch (error) {
      console.error('Error selecting images:', error);
      return null;
    }
  });

  // Process dropped files/directories from drag-and-drop
  ipcMain.handle('process-dropped-files', async (event, droppedPaths) => {
    try {
      const results = [];
      const supportedExtensions = ['.jpg', '.jpeg', '.png', '.eps', '.svg', '.mp4', '.mov'];

      for (const droppedPath of droppedPaths) {
        try {
          const stats = await fs.promises.stat(droppedPath);

          if (stats.isDirectory()) {
            const imageCount = await countImagesInDirectory(droppedPath);
            results.push({
              type: 'directory',
              path: droppedPath,
              imageCount,
            });
          } else if (stats.isFile()) {
            const ext = path.extname(droppedPath).toLowerCase();
            if (supportedExtensions.includes(ext)) {
              results.push({
                type: 'file',
                path: droppedPath,
                filename: path.basename(droppedPath),
                directory: path.dirname(droppedPath),
              });
            }
          }
        } catch (err) {
          console.error(`Error processing dropped path ${droppedPath}:`, err);
        }
      }

      return results;
    } catch (error) {
      console.error('Error processing dropped files:', error);
      return [];
    }
  });

  // Get folder preview (first 12 supported files)
  ipcMain.handle('get-folder-preview', async (event, folderPath) => {
    try {
      const files = await fs.promises.readdir(folderPath);
      const supportedExtensions = ['.jpg', '.jpeg', '.png', '.eps', '.svg', '.mp4', '.mov', '.avi', '.mkv', '.webm'];

      const supportedFiles = files
        .filter((file) => supportedExtensions.includes(path.extname(file).toLowerCase()))
        .map((file) => ({
          name: file,
          path: path.join(folderPath, file),
          filename: file,
        }))
        .slice(0, 12);

      const totalCount = files.filter((file) => supportedExtensions.includes(path.extname(file).toLowerCase())).length;

      return {
        files: supportedFiles,
        totalCount,
        folderPath,
      };
    } catch (err) {
      console.error(`Error getting folder preview: ${err.message}`);
      return {
        files: [],
        totalCount: 0,
        folderPath,
        error: err.message,
      };
    }
  });
}

module.exports = { registerPathHandler };
