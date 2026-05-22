const path = require("path");

const CONSTANTS = require("../../config/constants");

/**
 * Determine media type (image, video, or unknown) from path and MIME type
 * @param {string} mediaPath - File path
 * @param {string} mimeType - MIME type
 * @returns {string} "image", "video", or "unknown"
 */
function getMediaType(mediaPath, mimeType) {
  const ext = path.extname(mediaPath).toLowerCase();

  if (CONSTANTS.SUPPORTED_VIDEO_FORMATS.includes(ext)) return "video";

  if (
    CONSTANTS.SUPPORTED_IMAGE_FORMATS.includes(ext) ||
    ext === CONSTANTS.EPS_FORMAT ||
    ext === CONSTANTS.SVG_FORMAT ||
    mimeType.startsWith("image/")
  ) {
    return "image";
  }

  return "unknown";
}

/**
 * Check if a file is an EPS file
 * @param {string} mediaPath - File path
 * @param {string} mimeType - MIME type
 * @returns {boolean}
 */
function isEpsFile(mediaPath, mimeType) {
  return (
    mimeType === "application/octet-stream" &&
    path.extname(mediaPath).toLowerCase() === CONSTANTS.EPS_FORMAT
  );
}

/**
 * Check if a file is an SVG file
 * @param {string} mediaPath - File path
 * @param {string} mimeType - MIME type
 * @returns {boolean}
 */
function isSvgFile(mediaPath, mimeType) {
  return (
    (mimeType === "image/svg+xml" || mimeType === "application/octet-stream") &&
    path.extname(mediaPath).toLowerCase() === CONSTANTS.SVG_FORMAT
  );
}

/**
 * Check if a file is a compressible image format
 * @param {string} mediaPath - File path
 * @returns {boolean}
 */
function isCompressibleImageFormat(mediaPath) {
  const ext = path.extname(mediaPath).toLowerCase();
  return CONSTANTS.SUPPORTED_IMAGE_FORMATS.includes(ext);
}

/**
 * Check if a file is a supported video format
 * @param {string} mediaPath - File path
 * @returns {boolean}
 */
function isVideoFormat(mediaPath) {
  return CONSTANTS.SUPPORTED_VIDEO_FORMATS.includes(
    path.extname(mediaPath).toLowerCase(),
  );
}

/**
 * Get the display filename for a media object
 * @param {object} media - Media object
 * @returns {string} Filename
 */
function getMediaFilename(media) {
  return media.originalname || media.filename || path.basename(media.path);
}

module.exports = {
  getMediaFilename,
  getMediaType,
  isCompressibleImageFormat,
  isEpsFile,
  isSvgFile,
  isVideoFormat,
};
