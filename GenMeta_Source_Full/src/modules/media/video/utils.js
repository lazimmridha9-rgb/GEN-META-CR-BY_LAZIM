const fs = require("fs");
const path = require("path");

/**
 * Check if a file is a video based on its extension
 * @param {string} filePath - Path to the file
 * @returns {boolean} True if video format
 */
function isVideoFile(filePath) {
  const CONSTANTS = require("../../../config/constants");
  const ext = path.extname(filePath).toLowerCase();
  return CONSTANTS.SUPPORTED_VIDEO_FORMATS.includes(ext);
}

/**
 * Get video MIME type based on file extension
 * @param {string} filePath - Path to the video file
 * @returns {string} MIME type
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
 * Get basic video file information
 * @param {string} filePath - Path to the video file
 * @returns {Promise<{filename: string, path: string, size: number, extension: string, mimeType: string, isVideo: boolean}>}
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

module.exports = { getVideoInfo, getVideoMimeType, isVideoFile };
