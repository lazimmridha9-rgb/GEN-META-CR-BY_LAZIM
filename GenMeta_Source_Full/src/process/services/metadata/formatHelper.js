const path = require("path");

/**
 * Extracts the file format (extension without dot) from a media path.
 * Normalizes "jpeg" to "jpg" and "mp4"/"mov" to "mp4".
 *
 * @param {string} mediaPath - Path to the media file.
 * @returns {string} Normalized format string (e.g., "jpg", "png", "mp4").
 */
function getFileFormat(mediaPath) {
  const fileExt = path.extname(mediaPath).toLowerCase().replace(".", "");
  if (["mp4", "mov"].includes(fileExt)) return "mp4";
  if (fileExt === "jpeg") return "jpg";
  return fileExt || "jpg";
}

/**
 * Extracts the filename from a prepared media item.
 *
 * @param {Object} preparedMedia - Prepared media object.
 * @param {number} index - Fallback index for naming.
 * @returns {string} The filename.
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
 * Extracts a human-readable base name from a media object,
 * replacing hyphens and underscores with spaces.
 *
 * @param {Object} originalMedia - Original media object.
 * @returns {string} Cleaned base name.
 */
function getBaseName(originalMedia) {
  let baseName = "media";

  if (originalMedia?.originalname) {
    baseName = path
      .basename(originalMedia.originalname, path.extname(originalMedia.originalname))
      .replace(/[-_]/g, " ");
  } else if (originalMedia?.path) {
    baseName = path
      .basename(originalMedia.path, path.extname(originalMedia.path))
      .replace(/[-_]/g, " ");
  }

  return baseName;
}

module.exports = { getFileFormat, getFilename, getBaseName };
