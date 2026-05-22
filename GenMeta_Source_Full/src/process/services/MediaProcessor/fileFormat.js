const path = require("path");
const CONSTANTS = require("../../../config/constant");

/**
 * Determines the media type (video, image, or unknown) based on path and MIME type.
 *
 * @param {string} mediaPath - Path to the media file.
 * @param {string} mimeType - MIME type of the file.
 * @returns {string} "video", "image", or "unknown".
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
 * Checks whether a file is an EPS file.
 *
 * @param {string} mediaPath - Path to the file.
 * @param {string} mimeType - MIME type.
 * @returns {boolean} True if the file is EPS.
 */
function isEpsFile(mediaPath, mimeType) {
  return (
    mimeType === "application/octet-stream" &&
    path.extname(mediaPath).toLowerCase() === CONSTANTS.EPS_FORMAT
  );
}

/**
 * Checks whether a file is an SVG file.
 *
 * @param {string} mediaPath - Path to the file.
 * @param {string} mimeType - MIME type.
 * @returns {boolean} True if the file is SVG.
 */
function isSvgFile(mediaPath, mimeType) {
  return (
    (mimeType === "image/svg+xml" || mimeType === "application/octet-stream") &&
    path.extname(mediaPath).toLowerCase() === CONSTANTS.SVG_FORMAT
  );
}

/**
 * Checks whether a file is in a compressible image format.
 *
 * @param {string} mediaPath - Path to the file.
 * @returns {boolean} True if the format supports compression.
 */
function isCompressibleImageFormat(mediaPath) {
  const ext = path.extname(mediaPath).toLowerCase();
  return CONSTANTS.SUPPORTED_IMAGE_FORMATS.includes(ext);
}

/**
 * Checks whether a file is a video format.
 *
 * @param {string} mediaPath - Path to the file.
 * @returns {boolean} True if the file is a video.
 */
function isVideoFormat(mediaPath) {
  return CONSTANTS.SUPPORTED_VIDEO_FORMATS.includes(
    path.extname(mediaPath).toLowerCase()
  );
}

/**
 * Extracts the filename from a media object.
 *
 * @param {Object} media - Media object.
 * @returns {string} The filename.
 */
function getMediaFilename(media) {
  return media.originalname || media.filename || path.basename(media.path);
}

module.exports = {
  getMediaType,
  isEpsFile,
  isSvgFile,
  isCompressibleImageFormat,
  isVideoFormat,
  getMediaFilename,
};
