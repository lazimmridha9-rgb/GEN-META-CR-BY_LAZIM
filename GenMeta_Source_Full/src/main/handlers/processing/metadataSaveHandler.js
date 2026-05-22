const path = require('path');
const fs = require('fs');
const { addMetadataDirectly } = require('../../../process/addMetadataToFile');
const { logError } = require('./progressTracker');

/**
 * Saves metadata to a file and its associated copies
 * @param {string} filePath - Path to the target file
 * @param {Object} metadata - Metadata object with title, description, keywords
 * @returns {Promise<Object>} Result of the save operation
 */
async function handleSaveMetadata(filePath, metadata) {
  if (!filePath || !fs.existsSync(filePath)) {
    return { success: false, message: 'File not found' };
  }

  // Normalize and validate metadata fields
  const formattedMetadata = {
    title: metadata.title !== undefined ? metadata.title.toString().trim() : '',
    description: metadata.description !== undefined ? metadata.description.toString().trim() : '',
    keywords: Array.isArray(metadata.keywords)
      ? metadata.keywords.map((k) => k.trim()).filter((k) => k)
      : typeof metadata.keywords === 'string'
        ? metadata.keywords.split(',').map((k) => k.trim()).filter((k) => k)
        : [],
  };

  // Apply metadata to the primary file
  const result = await addMetadataDirectly(filePath, formattedMetadata);

  // Also update JPG copy for EPS/SVG files
  const fileExt = path.extname(filePath).toLowerCase();
  if (fileExt === '.eps' || fileExt === '.svg') {
    const jpgPath = filePath.replace(/\.(eps|svg)$/i, '.jpg');
    if (fs.existsSync(jpgPath)) {
      try {
        await addMetadataDirectly(jpgPath, formattedMetadata);
      } catch (e) {
        console.error(`Error updating JPG copy: ${e.message}`);
      }
    }
  }

  if (result.status) {
    return { success: true, message: 'Metadata updated successfully' };
  }

  return { success: false, message: result.message };
}

module.exports = { handleSaveMetadata };
