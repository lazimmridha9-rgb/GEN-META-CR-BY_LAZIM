const { downloadGhostscript, getDownloadsPath } = require("./downloader");
const { installGhostscript } = require("./installer");
const { findGhostscriptPath, isGhostscriptInstalled } = require("./detector");
const { getSystemInfo } = require("./system");

/**
 * Full Ghostscript setup flow: check → download → install
 * @param {Function|null} [downloadProgressCallback=null] - Download progress callback
 * @param {Function|null} [installProgressCallback=null] - Install progress callback
 * @param {Function|null} [onInstallDetected=null] - Installation detection callback
 * @returns {Promise<object>} Setup result
 */
async function setupGhostscript(
  downloadProgressCallback = null,
  installProgressCallback = null,
  onInstallDetected = null,
) {
  const installCheck = await isGhostscriptInstalled();

  if (installCheck.installed) {
    if (installCheck.warning) {
      console.warn(`Warning: ${installCheck.warning}`);
    }
    if (onInstallDetected && typeof onInstallDetected === "function") {
      onInstallDetected(installCheck);
    }
    return {
      alreadyInstalled: true,
      path: installCheck.path,
      version: installCheck.version,
    };
  }

  const downloadedFile = await downloadGhostscript(downloadProgressCallback);
  const installResult = await installGhostscript(
    downloadedFile,
    installProgressCallback,
    onInstallDetected,
  );

  if (installResult && (installResult.manual || installResult.installing)) {
    return installResult;
  }

  if (installResult && installResult.installed) {
    if (onInstallDetected && typeof onInstallDetected === "function") {
      onInstallDetected(installResult);
    }
  }

  return installResult;
}

/**
 * Clean up downloaded Ghostscript installer files
 * @returns {Promise<boolean>} True if cleanup succeeded
 */
async function cleanupDownloads() {
  try {
    await require("fs").promises.rmdir(getDownloadsPath(), {
      recursive: true,
    });
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = {
  cleanupDownloads,
  downloadGhostscript,
  findGhostscriptPath,
  getDownloadsPath,
  getSystemInfo,
  installGhostscript,
  isGhostscriptInstalled,
  setupGhostscript,
};
