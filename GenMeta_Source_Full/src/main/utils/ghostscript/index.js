const { downloadGhostscript, getDownloadsPath } = require('./downloader');
const { installGhostscript } = require('./installer');
const { findGhostscriptPath, isGhostscriptInstalled } = require('./detector');
const { getSystemInfo } = require('./systemInfo');

/**
 * Complete Ghostscript setup: checks existing install, downloads if needed, then installs
 * @param {Function|null} downloadProgressCallback - Progress callback for download
 * @param {Function|null} installProgressCallback - Progress callback for installation
 * @param {Function|null} onInstallDetected - Callback when installation is detected
 * @returns {Promise<Object>} Installation result
 */
async function setupGhostscript(
  downloadProgressCallback = null,
  installProgressCallback = null,
  onInstallDetected = null,
) {
  // Check if already installed
  const installCheck = await isGhostscriptInstalled();
  if (installCheck.installed) {
    if (installCheck.warning) {
      console.warn(`Warning: ${installCheck.warning}`);
    }
    if (onInstallDetected && typeof onInstallDetected === 'function') {
      onInstallDetected(installCheck);
    }
    return {
      alreadyInstalled: true,
      path: installCheck.path,
      version: installCheck.version,
    };
  }

  // Download and install
  const downloadedFile = await downloadGhostscript(downloadProgressCallback);
  const installResult = await installGhostscript(downloadedFile, installProgressCallback, onInstallDetected);

  if (installResult && (installResult.manual || installResult.installing)) {
    return installResult;
  }

  if (installResult && installResult.installed) {
    if (onInstallDetected && typeof onInstallDetected === 'function') {
      onInstallDetected(installResult);
    }
  }

  return installResult;
}

/**
 * Removes downloaded Ghostscript installer files
 * @returns {Promise<boolean>} Whether cleanup succeeded
 */
async function cleanupDownloads() {
  try {
    await require('fs').promises.rmdir(getDownloadsPath(), { recursive: true });
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = {
  downloadGhostscript,
  installGhostscript,
  setupGhostscript,
  findGhostscriptPath,
  isGhostscriptInstalled,
  cleanupDownloads,
  getSystemInfo,
  getDownloadsPath,
};
