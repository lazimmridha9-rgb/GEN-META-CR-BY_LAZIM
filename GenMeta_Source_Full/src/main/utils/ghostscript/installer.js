const path = require('path');
const { shell } = require('electron');
const { isGhostscriptInstalled, findGhostscriptPath } = require('./detector');
const { verifyGhostscriptFunctionality } = require('./verifier');
const { execAsync } = require('./execHelper');

/**
 * Checks if Ghostscript has been installed and is functional
 * @param {number} checkCount - Current check iteration
 * @param {number} maxChecks - Maximum number of checks
 * @returns {Promise<Object|null>} Installation info or null
 */
async function checkInstallation(checkCount, maxChecks) {
  try {
    const gsPath = await findGhostscriptPath();
    if (gsPath) {
      try {
        const { stdout } = await execAsync(`"${gsPath}" --version`, 10000);
        const version = stdout.trim();
        const funcTest = await verifyGhostscriptFunctionality(gsPath);

        return {
          installed: true,
          path: gsPath,
          version,
          functional: funcTest.success,
          message: funcTest.success
            ? 'Ghostscript installed and functioning!'
            : 'Ghostscript detected but test failed.',
          testOutput: funcTest.output,
          testError: funcTest.error,
        };
      } catch (e) {
        return {
          installed: true,
          path: gsPath,
          version: 'Unknown',
          functional: false,
          message: 'Ghostscript detected but version unknown.',
          error: e.message,
        };
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Opens the installer and polls for installation completion
 * @param {string} installerPath - Path to the installer executable
 * @param {Function} resolve - Promise resolve function
 * @param {Function} reject - Promise reject function
 * @param {Function|null} onInstallDetected - Callback when install detected
 */
async function openManualInstaller(installerPath, resolve, reject, onInstallDetected = null) {
  try {
    const result = await shell.openPath(installerPath);
    if (result) {
      reject(new Error(`Failed to open installer: ${result}`));
      return;
    }

    const CHECK_INTERVAL = 5000;
    const MAX_CHECKS = 20;
    let checkCount = 0;

    const checkTimer = setInterval(async () => {
      try {
        checkCount++;
        const installInfo = await checkInstallation(checkCount, MAX_CHECKS);

        if (installInfo) {
          clearInterval(checkTimer);
          if (typeof onInstallDetected === 'function') {
            onInstallDetected(installInfo);
          }
          resolve(installInfo);
          return;
        }

        if (checkCount >= MAX_CHECKS) {
          clearInterval(checkTimer);
          resolve({
            manual: true,
            message: 'Installation could not be automatically verified. Please restart the app after installation.',
            installerPath,
            instructions: [
              '1. Complete the Ghostscript installation',
              '2. Restart this application',
            ],
          });
        }
      } catch (error) {
        console.error('Error during installation check:', error);
      }
    }, CHECK_INTERVAL);

    resolve({
      installing: true,
      checking: true,
      message: 'Installing Ghostscript. Please complete the installation in the opened installer window.',
      installerPath,
      instructions: [
        '1. Complete the Ghostscript installation using the opened installer',
        '2. Use default installation settings (recommended)',
        '3. The application will automatically detect when installation is complete',
      ],
    });
  } catch (shellError) {
    reject(new Error(`Failed to open installer: ${shellError.message}`));
  }
}

/**
 * Initiates Ghostscript installation via the downloaded installer
 * @param {string} downloadedFilePath - Path to the downloaded installer
 * @param {Function|null} progressCallback - Progress callback
 * @param {Function|null} onInstallDetected - Callback when install detected
 * @returns {Promise<Object>} Installation result
 */
async function installGhostscript(downloadedFilePath, progressCallback = null, onInstallDetected = null) {
  if (progressCallback) progressCallback('starting', 0);
  if (progressCallback) progressCallback('preparing', 10);

  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        await openManualInstaller(downloadedFilePath, resolve, reject, onInstallDetected);
      } catch (error) {
        reject(error);
      }
    }, 1000);
  });
}

module.exports = { installGhostscript, checkInstallation, openManualInstaller };
