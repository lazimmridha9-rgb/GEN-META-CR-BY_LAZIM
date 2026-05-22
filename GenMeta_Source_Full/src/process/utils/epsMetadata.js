const path = require("path");
const fs = require("fs");
const { exiftool } = require("exiftool-vendored");
const { getMimeType } = require("./getMimeType");

// ============================================================================
// EPS Metadata Helpers
// ============================================================================

/**
 * Normalizes metadata for EPS files from various input formats.
 *
 * @param {Object} metadata - Raw metadata object.
 * @returns {Object} Normalized metadata.
 */
function normalizeEpsMetadata(metadata) {
  return {
    title: metadata.title || metadata.Title || "",
    description: metadata.description || metadata.Description || "",
    keywords: metadata.keywords || [],
  };
}

/**
 * Prepares EPS-specific metadata tags for exiftool.
 *
 * @param {Object} metadata - Normalized metadata.
 * @returns {Object} EPS metadata tags.
 */
function prepareEpsMetadata(metadata) {
  const { title, description, keywords } = normalizeEpsMetadata(metadata);

  return {
    // Title fields
    "XMP:Title": title,
    Title: title,
    ObjectName: title,
    Headline: title,
    XPTitle: title,

    // Description fields
    "Caption-Abstract": description,
    ImageDescription: description,
    XPSubject: description,
    Description: description,

    // Keywords fields
    Keywords: keywords, // Array format: ["test", "keywords"]
    XPKeywords: keywords.join("; "), // String format: "test; keywords"
  };
}

// ============================================================================
// File Operations
// ============================================================================

/**
 * Cleans up the backup file created by exiftool during metadata writing.
 *
 * @param {string} filePath - Path to the file.
 */
async function cleanupEpsOriginalFile(filePath) {
  const originalFilePath = `${filePath}_original`;
  if (fs.existsSync(originalFilePath)) {
    await fs.promises.unlink(originalFilePath);
  }
}

/**
 * Writes metadata to an EPS file using exiftool.
 *
 * @param {string} filePath - Path to the EPS file.
 * @param {Object} metadata - Metadata to write.
 */
async function writeEpsMetadata(filePath, metadata) {
  const epsMetadata = prepareEpsMetadata(metadata);
  await exiftool.write(filePath, epsMetadata, ["-overwrite_original"]);
  await cleanupEpsOriginalFile(filePath);
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Adds metadata to an EPS file, optionally copying to a custom output path.
 *
 * @param {string} filePath - Source EPS file path.
 * @param {Object} metadata - Metadata to add.
 * @param {string|null} [outputPath=null] - Custom output path (optional).
 * @returns {Promise<Object>} Result with status, message, outputPath, and mimeType.
 */
async function addMetadataToEpsFile(filePath, metadata, outputPath = null) {
  try {
    const targetPath = outputPath || filePath;

    // Copy file if output path differs from source
    if (outputPath && outputPath !== filePath) {
      await fs.promises.copyFile(filePath, outputPath);
    }

    await writeEpsMetadata(targetPath, metadata);

    return {
      status: true,
      message: "EPS metadata added successfully",
      outputPath: targetPath,
      mimeType: getMimeType(targetPath),
    };
  } catch (error) {
    console.error(
      `Error adding metadata to EPS file ${path.basename(filePath)}:`,
      error
    );
    return {
      status: false,
      message: `Failed to add EPS metadata: ${error.message}`,
      outputPath: null,
    };
  }
}

/**
 * Adds metadata directly to an existing EPS file (in-place modification).
 *
 * @param {string} filePath - EPS file path.
 * @param {Object} metadata - Metadata to add.
 * @returns {Promise<Object>} Result with status, message, filePath, and mimeType.
 */
async function addMetadataToEpsFileDirectly(filePath, metadata) {
  try {
    if (!fs.existsSync(filePath)) {
      return {
        status: false,
        message: `EPS file not found: ${filePath}`,
      };
    }

    await writeEpsMetadata(filePath, metadata);

    return {
      status: true,
      message: "EPS metadata added successfully",
      filePath,
      mimeType: getMimeType(filePath),
    };
  } catch (error) {
    console.error(
      `Error adding metadata to EPS file ${path.basename(filePath)}:`,
      error
    );
    return {
      status: false,
      message: `Failed to add EPS metadata: ${error.message}`,
      filePath,
    };
  }
}

module.exports = {
  normalizeEpsMetadata,
  prepareEpsMetadata,
  writeEpsMetadata,
  addMetadataToEpsFile,
  addMetadataToEpsFileDirectly,
};
