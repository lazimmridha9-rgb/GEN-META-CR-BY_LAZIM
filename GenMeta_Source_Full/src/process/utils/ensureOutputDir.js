const fs = require("fs");
const path = require("path");

/**
 * Ensures that an output directory exists, creating it if necessary.
 * Uses a custom directory if provided, otherwise defaults to the
 * directory containing the original file.
 *
 * @param {string} originalPath - Path to the original file.
 * @param {string|null} [customOutputDir=null] - Custom output directory path.
 * @returns {Promise<string>} The resolved output directory path.
 */
async function ensureOutputDirectory(originalPath, customOutputDir = null) {
  if (customOutputDir) {
    if (!fs.existsSync(customOutputDir)) {
      await fs.promises.mkdir(customOutputDir, { recursive: true });
    }
    return customOutputDir;
  }

  const outputDir = path.dirname(originalPath);

  if (!fs.existsSync(outputDir)) {
    await fs.promises.mkdir(outputDir, { recursive: true });
  }

  return outputDir;
}

module.exports = { ensureOutputDirectory };
