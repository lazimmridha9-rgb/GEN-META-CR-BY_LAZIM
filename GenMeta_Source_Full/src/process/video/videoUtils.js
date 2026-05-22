const fs = require("fs");
const path = require("path");

/**
 * Checks if a file is a video based on its extension.
 *
 * @param {string} filePath - Path to the file.
 * @returns {boolean} True if the file extension is a supported video format.
 */
function isVideoFile(filePath) {
  const CONSTANTS = require("../../config/constant");
  const ext = path.extname(filePath).toLowerCase();
  return CONSTANTS.SUPPORTED_VIDEO_FORMATS.includes(ext);
}

/**
 * Returns the MIME type for a video file based on its extension.
 *
 * @param {string} filePath - Path to the video file.
 * @returns {string} The MIME type (defaults to "video/mp4" if unknown).
 */
function getVideoMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
    ".avi": "video/x-msvideo",
    ".mkv": "video/x-matroska",
    ".webm": "video/webm",
  };
  return mimeTypes[ext] || "video/mp4";
}

/**
 * Retrieves basic information about a video file.
 *
 * @param {string} filePath - Path to the video file.
 * @returns {Promise<Object>} File information including filename, size, extension, and MIME type.
 * @throws {Error} If the file cannot be accessed.
 */
async function getVideoInfo(filePath) {
  try {
    const stats = await fs.promises.stat(filePath);
    const filename = path.basename(filePath);
    const ext = path.extname(filePath).toLowerCase();

    return {
      filename,
      path: filePath,
      size: stats.size,
      extension: ext,
      mimeType: getVideoMimeType(filePath),
      isVideo: true,
    };
  } catch (error) {
    throw new Error(`Failed to get video info: ${error.message}`);
  }
}

module.exports = {
  isVideoFile,
  getVideoMimeType,
  getVideoInfo,
};
