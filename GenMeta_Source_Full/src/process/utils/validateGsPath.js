const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);

/**
 * Validates that the Ghostscript executable exists at the given path
 * and retrieves its version.
 *
 * @param {string} dirPath - The folder or full file path to check.
 * @returns {Promise<Object>} Result with success status, message, fullPath, and version.
 */
async function validateGsPath(dirPath) {
  try {
    let checkPath = dirPath;
    let exeName = "gswin64c.exe";

    // Handle 32-bit version selection
    if (dirPath.toLowerCase().endsWith("gswin32c.exe")) {
      checkPath = path.dirname(dirPath);
      exeName = path.basename(dirPath);
    }
    // Handle direct file path to 64-bit executable
    else if (dirPath.toLowerCase().endsWith("gswin64c.exe")) {
      checkPath = path.dirname(dirPath);
      exeName = path.basename(dirPath);
    }

    const rawFullPath = path.join(checkPath, exeName);
    const fullPath = rawFullPath.replace(/\\/g, "/");

    // Verify the file exists and is accessible
    await fs.promises.access(fullPath, fs.constants.F_OK);

    // Attempt to retrieve the Ghostscript version
    try {
      const { stdout } = await execFileAsync(fullPath, ["--version"]);
      const version = stdout.trim();

      return {
        success: true,
        message: `Ghostscript ${version} found successfully.`,
        fullPath,
        version,
      };
    } catch (error) {
      // File exists but version check failed — still consider it valid
      console.warn(
        `Could not determine Ghostscript version: ${error.message}`
      );
      return {
        success: true,
        message: `Ghostscript executable found but couldn't determine version.`,
        fullPath,
        version: "Unknown",
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Ghostscript executable not found or not accessible: ${error.message}`,
    };
  }
}

module.exports = { validateGsPath };
