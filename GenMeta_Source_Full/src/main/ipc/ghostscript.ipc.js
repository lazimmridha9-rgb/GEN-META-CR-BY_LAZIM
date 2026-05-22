const { ipcMain, app } = require('electron');
const fs = require('fs');
const path = require('path');
const { validateGsPath } = require('../../modules/ghostscript/validate');
const {
  setupGhostscript,
  isGhostscriptInstalled,
  findGhostscriptPath,
} = require('../../utils/ghostscriptInstaller');

/**
 * Saves the Ghostscript path to settings.json
 * @param {string} gsPath - The Ghostscript executable path
 */
function saveGsPathToSettings(gsPath) {
  const settingsPath = path.join(app.getPath('userData'), 'settings.json');
  let settings = {};

  try {
    if (fs.existsSync(settingsPath)) {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    }

    settings.gsPath = gsPath;
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  } catch (saveError) {
    console.error('Error saving Ghostscript path to settings:', saveError);
  }
}

/**
 * Registers Ghostscript path-related IPC handlers
 */
function registerGsPathHandlers() {
  // Check if Ghostscript is installed
  ipcMain.handle('check-gs-installed', async () => {
    try {
      return await isGhostscriptInstalled();
    } catch (error) {
      console.error('Error checking Ghostscript installation:', error);
      return {
        installed: false,
        error: error.message,
      };
    }
  });

  // Find Ghostscript path automatically
  ipcMain.handle('find-gs-path', async () => {
    try {
      const gsPath = await findGhostscriptPath();
      const validation = await validateGsPath(gsPath);

      if (validation.success) {
        return {
          success: true,
          path: gsPath,
          version: validation.version,
        };
      }

      return {
        success: false,
        error: 'Found path is not valid',
        path: gsPath,
      };
    } catch (error) {
      console.error('Error finding Ghostscript path:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  });

  // Install Ghostscript
  ipcMain.handle('install-ghostscript', async (event) => {
    try {
      // Callback to send download progress to renderer
      const downloadProgressCallback = (progress, downloaded, total) => {
        if (event.sender && !event.sender.isDestroyed()) {
          event.sender.send('ghostscript-download-progress', {
            progress,
            downloaded,
            total,
          });
        }
      };

      // Callback to send install progress to renderer
      const installProgressCallback = (stage, progress) => {
        if (event.sender && !event.sender.isDestroyed()) {
          event.sender.send('ghostscript-install-progress', {
            stage,
            progress,
          });
        }
      };

      // Callback for when installation is detected (e.g., manual installs)
      const onInstallDetected = (installInfo) => {
        if (event.sender && !event.sender.isDestroyed()) {
          event.sender.send('ghostscript-install-detected', installInfo);

          if (installInfo.path) {
            saveGsPathToSettings(installInfo.path);
          } else {
            console.error('No Ghostscript path provided in installInfo');
          }
        }
      };

      // Start the installation process
      const result = await setupGhostscript(
        downloadProgressCallback,
        installProgressCallback,
        onInstallDetected,
      );

      // Save path to settings if installation succeeded
      if (result.installed || result.alreadyInstalled) {
        saveGsPathToSettings(result.path);
      }

      return result;
    } catch (error) {
      console.error('Error installing Ghostscript:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  });
}

module.exports = { registerGsPathHandlers };
