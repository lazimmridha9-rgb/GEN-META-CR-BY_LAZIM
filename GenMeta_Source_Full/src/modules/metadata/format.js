const path = require("path");

/**
 * Get the file format from a media path for prompt selection
 * @param {string} mediaPath - File path
 * @returns {string} Normalized format string
 */
function getFileFormat(mediaPath) {
  const fileExt = path
    .extname(mediaPath)
    .toLowerCase()
    .replace(".", "");

  if (["mp4", "mov"].includes(fileExt)) return "mp4";
  if (fileExt === "jpeg") return "jpg";
  return fileExt || "jpg";
}

/**
 * Get the display filename for a prepared media item
 * @param {object} preparedMedia - Prepared media object
 * @param {number} index - Item index
 * @returns {string} Filename
 */
function getFilename(preparedMedia, index) {
  return (
    preparedMedia?.originalMedia?.originalname ||
    (preparedMedia?.originalMedia?.path
      ? path.basename(preparedMedia.originalMedia.path)
      : `media_${index}`)
  );
}

/**
 * Extract a human-readable base name from media metadata
 * @param {object} originalMedia - Original media object
 * @returns {string} Base name with dashes/underscores replaced by spaces
 */
function getBaseName(originalMedia) {
  let baseName = "media";

  if (originalMedia?.originalname) {
    baseName = path
      .basename(
        originalMedia.originalname,
        path.extname(originalMedia.originalname),
      )
      .replace(/[-_]/g, " ");
  } else if (originalMedia?.path) {
    baseName = path
      .basename(originalMedia.path, path.extname(originalMedia.path))
      .replace(/[-_]/g, " ");
  }

  return baseName;
}

module.exports = { getBaseName, getFileFormat, getFilename };
