const path = require("path");
const fs = require("fs");

const { addMetadataDirectly } = require("../metadata/file-writer");
const { logError } = require("./progress");

/**
 * Handle saving metadata to a file from the renderer
 * Also updates JPG copies for EPS/SVG files
 * @param {string} filePath - Path to the file
 * @param {object} metadata - Metadata object with title, description, keywords
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function handleSaveMetadata(filePath, metadata) {
  if (!filePath || !fs.existsSync(filePath)) {
    return { success: false, message: "File not found" };
  }

  // Normalize metadata fields
  const formattedMetadata = {
    title:
      metadata.title !== undefined
        ? metadata.title.toString().trim()
        : "",
    description:
      metadata.description !== undefined
        ? metadata.description.toString().trim()
        : "",
    keywords: Array.isArray(metadata.keywords)
      ? metadata.keywords.map((k) => k.trim()).filter((k) => k)
      : typeof metadata.keywords === "string"
        ? metadata.keywords
            .split(",")
            .map((k) => k.trim())
            .filter((k) => k)
        : [],
  };

  const result = await addMetadataDirectly(filePath, formattedMetadata);

  // Also update JPG copy for EPS/SVG files
  const fileExt = path.extname(filePath).toLowerCase();
  if (fileExt === ".eps" || fileExt === ".svg") {
    const jpgPath = filePath.replace(/\.(eps|svg)$/i, ".jpg");
    if (fs.existsSync(jpgPath)) {
      try {
        await addMetadataDirectly(jpgPath, formattedMetadata);
      } catch (e) {
        console.error(`Error updating JPG copy: ${e.message}`);
      }
    }
  }

  if (result.status) {
    return { success: true, message: "Metadata updated successfully" };
  }

  return { success: false, message: result.message };
}

module.exports = { handleSaveMetadata };
