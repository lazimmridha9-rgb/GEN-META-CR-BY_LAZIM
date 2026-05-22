const fs = require("fs");
const path = require("path");
const { exiftool } = require("exiftool-vendored");

const { prepareMetadata } = require("./utils/exif.utils");
const { getMimeType } = require("./utils/getMimeType");
const { ensureOutputDirectory } = require("./utils/ensureOutputDir");
const {
  addMetadataToEpsFile,
  addMetadataToEpsFileDirectly,
} = require("./utils/epsMetadata");

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Ensures a directory exists, creating it recursively if needed.
 *
 * @param {string} dirPath - Directory path to ensure.
 */
async function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    await fs.promises.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Cleans up the backup file created by exiftool during metadata writing.
 *
 * @param {string} filePath - Path to the file whose backup should be removed.
 */
async function cleanupOriginalFile(filePath) {
  const originalFilePath = `${filePath}_original`;
  if (fs.existsSync(originalFilePath)) {
    await fs.promises.unlink(originalFilePath);
  }
}

/**
 * Prepares the output path for the metadata file, using a custom path or defaulting
 * to the source file's directory.
 *
 * @param {string} filePath - Source file path.
 * @param {string|null} customOutputPath - Custom output path (optional).
 * @returns {Promise<string>} The resolved output path.
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
 * Writes metadata to a file using exiftool.
 *
 * @param {string} filePath - File path.
 * @param {Object} metadata - Metadata to write.
 * @param {string} ext - File extension.
 */
async function writeMetadataToFile(filePath, metadata, ext) {
  const metadataToWrite = prepareMetadata(metadata, ext);
  await exiftool.write(filePath, metadataToWrite, ["-overwrite_original"]);
  await cleanupOriginalFile(filePath);
}

/**
 * Checks whether the given file format supports embedded metadata.
 *
 * @param {string} ext - File extension (e.g., ".svg").
 * @returns {boolean} True if the format supports metadata.
 */
function isMetadataSupported(ext) {
  const unsupportedFormats = [".svg"];
  return !unsupportedFormats.includes(ext);
}

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Adds metadata to a file, optionally writing to a custom output path.
 *
 * @param {string} filePath - Source file path.
 * @param {Object} metadata - Metadata to add.
 * @param {string|null} [customOutputPath=null] - Custom output path (optional).
 * @returns {Promise<Object>} Result object with status, message, outputPath, and mimeType.
 */
async function addMetadataToFile(
  filePath,
  metadata,
  customOutputPath = null
) {
  const ext = path.extname(filePath).toLowerCase();

  // Handle unsupported formats (e.g., SVG)
  if (!isMetadataSupported(ext)) {
    return {
      status: true,
      message: `${ext.toUpperCase()} file (metadata not added to ${ext.toUpperCase()} files)`,
      outputPath: filePath,
      mimeType: getMimeType(filePath),
    };
  }

  // Handle EPS files with dedicated utility
  if (ext === ".eps") {
    const outputPath = await prepareOutputPath(filePath, customOutputPath);
    return addMetadataToEpsFile(filePath, metadata, outputPath);
  }

  // Handle other supported formats: copy, then embed metadata
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
      error
    );
    return {
      status: false,
      message: `Failed to add metadata: ${error.message}`,
      outputPath: null,
    };
  }
}

/**
 * Adds metadata directly to an existing file (in-place modification).
 *
 * @param {string} filePath - File path.
 * @param {Object} metadata - Metadata to add.
 * @returns {Promise<Object>} Result object with status, message, filePath, and mimeType.
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

    // Handle unsupported formats (e.g., SVG)
    if (!isMetadataSupported(ext)) {
      return {
        status: true,
        message: `${ext.toUpperCase()} file (metadata not added to ${ext.toUpperCase()} files)`,
        filePath,
        mimeType: getMimeType(filePath),
      };
    }

    // Handle EPS files with dedicated utility
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
      error
    );
    return {
      status: false,
      message: `Failed to add metadata: ${error.message}`,
      filePath,
    };
  }
}

module.exports = {
  addMetadataToFile,
  addMetadataDirectly,
};
