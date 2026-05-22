// Node modules
const fs = require("fs");
const path = require("path");

/** @type {string[]} Supported video file extensions. */
const VIDEO_EXTENSIONS = [".mp4", ".mov"];

/**
 * Checks if a file is a video based on its extension.
 *
 * @param {string} filePath - The path to the file.
 * @returns {boolean} True if the file has a video extension.
 */
function isVideoFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return VIDEO_EXTENSIONS.includes(ext);
}

/**
 * Finds all video files in a given directory.
 *
 * @param {string} directoryPath - The directory to search.
 * @returns {string[]} Array of full paths to video files.
 */
function getVideoFiles(directoryPath) {
  if (!fs.existsSync(directoryPath) || !fs.statSync(directoryPath).isDirectory()) {
    return [];
  }

  return fs
    .readdirSync(directoryPath)
    .filter((file) => {
      const filePath = path.join(directoryPath, file);
      return fs.statSync(filePath).isFile() && isVideoFile(filePath);
    })
    .map((file) => path.join(directoryPath, file));
}

/**
 * Gets basic information about a video file without processing it.
 *
 * @param {string} filePath - Path to the video file.
 * @returns {Object} File info including name, size, extension, and timestamps.
 * @throws {Error} If the file doesn't exist or isn't a supported format.
 */
function getVideoFileInfo(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Video file not found: ${filePath}`);
  }

  const stats = fs.statSync(filePath);
  const ext = path.extname(filePath).toLowerCase();

  if (!isVideoFile(filePath)) {
    throw new Error(`File is not a supported video format: ${filePath}`);
  }

  return {
    filename: path.basename(filePath),
    path: filePath,
    size: stats.size,
    extension: ext,
    created: stats.birthtime,
    modified: stats.mtime,
  };
}

/**
 * Formats a byte count into a human-readable string.
 *
 * @param {number} bytes - File size in bytes.
 * @returns {string} Formatted size (e.g., "1.5 MB").
 */
function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Formats a duration in seconds to HH:MM:SS format.
 *
 * @param {number} seconds - Duration in seconds.
 * @returns {string} Formatted duration string.
 */
function formatDuration(seconds) {
  if (!seconds || seconds < 0) return "00:00:00";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return [hours, minutes, secs]
    .map((v) => v.toString().padStart(2, "0"))
    .join(":");
}

/**
 * Sanitizes a video filename for use as metadata title.
 * Converts underscores/hyphens to spaces and applies title case.
 *
 * @param {string} filename - Original filename.
 * @returns {string} Sanitized and title-cased filename.
 */
function sanitizeVideoFilename(filename) {
  return path
    .basename(filename, path.extname(filename))
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

module.exports = {
  VIDEO_EXTENSIONS,
  isVideoFile,
  getVideoFiles,
  getVideoFileInfo,
  formatFileSize,
  formatDuration,
  sanitizeVideoFilename,
};
