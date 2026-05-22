const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);

/**
 * Validate a Ghostscript path by checking if the executable exists and getting its version
 * @param {string} dirPath - Folder or full file path to check
 * @returns {Promise<{success: boolean, message: string, fullPath?: string, version?: string}>}
 */
async function validateGsPath(dirPath) {
  try {
    let checkPath = dirPath;
    let exeName = "gswin64c.exe";

    // Handle 32-bit version
    if (dirPath.toLowerCase().endsWith("gswin32c.exe")) {
      checkPath = path.dirname(dirPath);
      exeName = path.basename(dirPath);
    }
    // Handle 64-bit version selected directly
    else if (dirPath.toLowerCase().endsWith("gswin64c.exe")) {
      checkPath = path.dirname(dirPath);
      exeName = path.basename(dirPath);
    }

    const rawFullPath = path.join(checkPath, exeName);
    const fullPath = rawFullPath.replace(/\\/g, "/");

    // Check file accessibility
    await fs.promises.access(fullPath, fs.constants.F_OK);

    // Get Ghostscript version
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
      // File exists but version check failed
      console.warn(
        `Could not determine Ghostscript version: ${error.message}`,
      );
      return {
        success: true,
        message:
          "Ghostscript executable found but couldn't determine version.",
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
