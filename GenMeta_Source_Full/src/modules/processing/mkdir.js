const fs = require("fs");
const path = require("path");

/**
 * Ensure the output directory exists for a given file path
 * @param {string} originalPath - Original file path
 * @param {string|null} [customOutputDir=null] - Custom output directory
 * @returns {Promise<string>} Output directory path
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
