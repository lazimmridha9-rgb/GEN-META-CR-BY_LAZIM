const path = require("path");
const fs = require("fs");

const { exiftool } = require("exiftool-vendored");
const { getMimeType } = require("../media/mime");

/**
 * Normalize metadata for EPS files (case-insensitive field mapping)
 * @param {object} metadata - Raw metadata object
 * @returns {{ title: string, description: string, keywords: object[] }}
 */
function normalizeEpsMetadata(metadata) {
  return {
    title: metadata.title || metadata.Title || "",
    description: metadata.description || metadata.Description || "",
    keywords: metadata.keywords || [],
  };
}

/**
 * Prepare EPS-specific metadata tags for exiftool
 * @param {object} metadata - Normalized metadata
 * @returns {object} EPS metadata tags
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
    Keywords: keywords,
    XPKeywords: keywords.join("; "),
  };
}

/**
 * Clean up the original backup file created by exiftool
 * @param {string} filePath - File path
 */
async function cleanupEpsOriginalFile(filePath) {
  const originalFilePath = `${filePath}_original`;
  if (fs.existsSync(originalFilePath)) {
    await fs.promises.unlink(originalFilePath);
  }
}

/**
 * Write metadata to an EPS file using exiftool
 * @param {string} filePath - EPS file path
 * @param {object} metadata - Metadata to write
 */
async function writeEpsMetadata(filePath, metadata) {
  const epsMetadata = prepareEpsMetadata(metadata);
  await exiftool.write(filePath, epsMetadata, ["-overwrite_original"]);
  await cleanupEpsOriginalFile(filePath);
}

/**
 * Add metadata to EPS file with output path handling
 * @param {string} filePath - Source EPS file path
 * @param {object} metadata - Metadata to add
 * @param {string|null} [outputPath=null] - Custom output path
 * @returns {Promise<{status: boolean, message: string, outputPath?: string, mimeType?: string}>}
 */
async function addMetadataToEpsFile(filePath, metadata, outputPath = null) {
  try {
    const targetPath = outputPath || filePath;

    // Copy file if output path differs
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
      error,
    );
    return {
      status: false,
      message: `Failed to add EPS metadata: ${error.message}`,
      outputPath: null,
    };
  }
}

/**
 * Add metadata directly to existing EPS file (in-place)
 * @param {string} filePath - EPS file path
 * @param {object} metadata - Metadata to add
 * @returns {Promise<{status: boolean, message: string, filePath?: string, mimeType?: string}>}
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
      error,
    );
    return {
      status: false,
      message: `Failed to add EPS metadata: ${error.message}`,
      filePath,
    };
  }
}

module.exports = {
  addMetadataToEpsFile,
  addMetadataToEpsFileDirectly,
  normalizeEpsMetadata,
  prepareEpsMetadata,
  writeEpsMetadata,
};
