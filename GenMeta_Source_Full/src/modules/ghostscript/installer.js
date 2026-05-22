const path = require("path");
const { shell } = require("electron");

const { findGhostscriptPath, isGhostscriptInstalled } = require("./detector");
const { execAsync } = require("./executor");
const { verifyGhostscriptFunctionality } = require("./verifier");

/**
 * Check Ghostscript installation status
 * @param {number} checkCount - Current check attempt
 * @param {number} maxChecks - Maximum checks to perform
 * @returns {Promise<object|null>} Installation info or null
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
            ? "Ghostscript installed and functioning!"
            : "Ghostscript detected but test failed.",
          testOutput: funcTest.output,
          testError: funcTest.error,
        };
      } catch (e) {
        return {
          installed: true,
          path: gsPath,
          version: "Unknown",
          functional: false,
          message: "Ghostscript detected but version unknown.",
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
 * Open the Ghostscript installer and monitor for completion
 * @param {string} installerPath - Path to installer executable
 * @param {Function} resolve - Promise resolve function
 * @param {Function} reject - Promise reject function
 * @param {Function|null} [onInstallDetected=null] - Callback on detection
 */
async function openManualInstaller(
  installerPath,
  resolve,
  reject,
  onInstallDetected = null,
) {
  try {
    const result = await shell.openPath(installerPath);
    if (result) {
      reject(new Error(`Failed to open installer: ${result}`));
      return;
    }

    const checkInterval = 5000;
    const maxChecks = 20;
    let checkCount = 0;

    const checkTimer = setInterval(async () => {
      try {
        checkCount++;
        const installInfo = await checkInstallation(checkCount, maxChecks);

        if (installInfo) {
          clearInterval(checkTimer);
          if (typeof onInstallDetected === "function") {
            onInstallDetected(installInfo);
          }
          resolve(installInfo);
          return;
        }

        if (checkCount >= maxChecks) {
          clearInterval(checkTimer);
          resolve({
            manual: true,
            message:
              "Installation could not be automatically verified. Please restart the app after installation.",
            installerPath,
            instructions: [
              "1. Complete the Ghostscript installation",
              "2. Restart this application",
            ],
          });
        }
      } catch (error) {
        console.error("Error during installation check:", error);
      }
    }, checkInterval);

    resolve({
      installing: true,
      checking: true,
      message:
        "Installing Ghostscript. Please complete the installation in the opened installer window.",
      installerPath,
      instructions: [
        "1. Complete the Ghostscript installation using the opened installer",
        "2. Use default installation settings (recommended)",
        "3. The application will automatically detect when installation is complete",
      ],
    });
  } catch (shellError) {
    reject(new Error(`Failed to open installer: ${shellError.message}`));
  }
}

/**
 * Install Ghostscript by opening the downloaded installer
 * @param {string} downloadedFilePath - Path to downloaded installer
 * @param {Function|null} [progressCallback=null] - Progress callback
 * @param {Function|null} [onInstallDetected=null] - Detection callback
 * @returns {Promise<object>} Installation result
 */
async function installGhostscript(
  downloadedFilePath,
  progressCallback = null,
  onInstallDetected = null,
) {
  if (progressCallback) progressCallback("starting", 0);
  if (progressCallback) progressCallback("preparing", 10);

  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        await openManualInstaller(
          downloadedFilePath,
          resolve,
          reject,
          onInstallDetected,
        );
      } catch (error) {
        reject(error);
      }
    }, 1000);
  });
}

module.exports = { checkInstallation, installGhostscript, openManualInstaller };
