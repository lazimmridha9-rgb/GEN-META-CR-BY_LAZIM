const path = require("path");
const fs = require("fs");

const { exiftool } = require("exiftool-vendored");
const { prepareMetadata } = require("./exif");
const { getMimeType } = require("../media/mime");
const { ensureOutputDirectory } = require("../processing/mkdir");
const {
  addMetadataToEpsFile,
  addMetadataToEpsFileDirectly,
} = require("./eps-writer");

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Ensure directory exists, create if not
 * @param {string} dirPath - Directory path
 */
async function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    await fs.promises.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Clean up the original backup file created by exiftool
 * @param {string} filePath - File path
 */
async function cleanupOriginalFile(filePath) {
  const originalFilePath = `${filePath}_original`;
  if (fs.existsSync(originalFilePath)) {
    await fs.promises.unlink(originalFilePath);
  }
}

/**
 * Prepare output path for metadata file
 * @param {string} filePath - Source file path
 * @param {string|null} customOutputPath - Custom output path
 * @returns {Promise<string>} Output path
 */
async function prepareOutputPath(filePath, customOutputPath) {
  if (customOutputPath) {
    await ensureDirectoryExists(path.dirname(customOutputPath));
    return customOutputPath;
  }

  const outputDir = await ensureOutputDirectory(filePath);
  const fileName = path.basename(filePath);
  return path.join(outputDir, fileName);
}

/**
 * Write metadata to file using exiftool
 * @param {string} filePath - File path
 * @param {object} metadata - Metadata to write
 * @param {string} ext - File extension
 */
async function writeMetadataToFile(filePath, metadata, ext) {
  const metadataToWrite = prepareMetadata(metadata, ext);
  await exiftool.write(filePath, metadataToWrite, ["-overwrite_original"]);
  await cleanupOriginalFile(filePath);
}

/**
 * Check if a file format supports metadata writing
 * @param {string} ext - File extension
 * @returns {boolean}
 */
function isMetadataSupported(ext) {
  const unsupportedFormats = [".svg"];
  return !unsupportedFormats.includes(ext);
}

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Add metadata to file with optional custom output path
 * @param {string} filePath - Source file path
 * @param {object} metadata - Metadata to add
 * @param {string|null} [customOutputPath=null] - Custom output path
 * @returns {Promise<{status: boolean, message: string, outputPath?: string, mimeType?: string}>}
 */
async function addMetadataToFile(filePath, metadata, customOutputPath = null) {
  const ext = path.extname(filePath).toLowerCase();

  // Handle unsupported formats (SVG)
  if (!isMetadataSupported(ext)) {
    return {
      status: true,
      message: `${ext.toUpperCase()} file (metadata not added to ${ext.toUpperCase()} files)`,
      outputPath: filePath,
      mimeType: getMimeType(filePath),
    };
  }

  // Handle EPS files
  if (ext === ".eps") {
    const outputPath = await prepareOutputPath(filePath, customOutputPath);
    return addMetadataToEpsFile(filePath, metadata, outputPath);
  }

  // Handle other supported formats
  try {
    const outputPath = await prepareOutputPath(filePath, customOutputPath);
    await fs.promises.copyFile(filePath, outputPath);
    await writeMetadataToFile(outputPath, metadata, ext);

    return {
      status: true,
      message: "Metadata added successfully",
      outputPath,
      mimeType: getMimeType(outputPath),
    };
  } catch (error) {
    console.error(
      `Error adding metadata to ${path.basename(filePath)}:`,
      error,
    );
    return {
      status: false,
      message: `Failed to add metadata: ${error.message}`,
      outputPath: null,
    };
  }
}

/**
 * Add metadata directly to existing file (in-place modification)
 * @param {string} filePath - File path
 * @param {object} metadata - Metadata to add
 * @returns {Promise<{status: boolean, message: string, filePath?: string, mimeType?: string}>}
 */
async function addMetadataDirectly(filePath, metadata) {
  try {
    if (!fs.existsSync(filePath)) {
      return {
        status: false,
        message: `File not found: ${filePath}`,
      };
    }

    const ext = path.extname(filePath).toLowerCase();

    // Handle unsupported formats (SVG)
    if (!isMetadataSupported(ext)) {
      return {
        status: true,
        message: `${ext.toUpperCase()} file (metadata not added to ${ext.toUpperCase()} files)`,
        filePath,
        mimeType: getMimeType(filePath),
      };
    }

    // Handle EPS files
    if (ext === ".eps") {
      return addMetadataToEpsFileDirectly(filePath, metadata);
    }

    // Handle other supported formats
    await writeMetadataToFile(filePath, metadata, ext);

    return {
      status: true,
      message: "Metadata added successfully",
      filePath,
      mimeType: getMimeType(filePath),
    };
  } catch (error) {
    console.error(
      `Error adding metadata to ${path.basename(filePath)}:`,
      error,
    );
    return {
      status: false,
      message: `Failed to add metadata: ${error.message}`,
      filePath,
    };
  }
}

module.exports = { addMetadataDirectly, addMetadataToFile };
