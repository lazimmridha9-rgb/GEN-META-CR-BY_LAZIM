// Node modules
const fs = require("fs");
const path = require("path");
const os = require("os");

// Local config
const APP_CONFIG = require("../config/app");

/**
 * Cleans up temporary directories created by the application.
 * Removes all files and subdirectories within each configured temp directory.
 */
function cleanupTempDirectories() {
  const tempDir = os.tmpdir();
  const dirsToClean = APP_CONFIG.TEMP_CLEANUP_DIRS;

  for (const dirName of dirsToClean) {
    const dirPath = path.join(tempDir, dirName);

    if (!fs.existsSync(dirPath)) {
      continue;
    }

    try {
      const files = fs.readdirSync(dirPath);
      let filesRemoved = 0;
      let dirsRemoved = 0;

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
          try {
            fs.rmdirSync(filePath, { recursive: true });
            dirsRemoved++;
          } catch (e) {
            console.error(`Error removing subdirectory ${filePath}: ${e.message}`);
          }
        } else {
          fs.unlinkSync(filePath);
          filesRemoved++;
        }
      }

      // Remove the now-empty parent directory
      fs.rmdirSync(dirPath);
    } catch (error) {
      console.error(`Error cleaning up directory ${dirPath}: ${error.message}`);
    }
  }
}

module.exports = { cleanupTempDirectories };
