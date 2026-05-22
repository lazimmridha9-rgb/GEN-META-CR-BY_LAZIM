const path = require("path");

/**
 * Returns the MIME type for a file based on its extension.
 *
 * @param {string} filePath - Path to the file.
 * @returns {string} The MIME type, or "application/octet-stream" if unrecognized.
 */
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  const mimeTypes = {
    // Image types
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".tiff": "image/tiff",
    ".tif": "image/tiff",
    // Video types
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
  };

  return mimeTypes[ext] || "application/octet-stream";
}

module.exports = { getMimeType };
