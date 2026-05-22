/**
 * File format constants for supported media types.
 */

/** @type {string[]} All supported file extensions in the application. */
const SUPPORTED_EXTENSIONS = [
  ".jpg", ".jpeg", ".png", ".eps", ".svg", ".mp4", ".mov",
];

/** @type {string[]} Image file extensions. */
const IMAGE_EXTENSIONS = [
  ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp",
];

/** @type {string[]} Video file extensions. */
const VIDEO_EXTENSIONS = [
  ".mp4", ".mov", ".avi", ".mkv", ".webm",
];

/**
 * MIME type mappings for common file extensions.
 * @type {Object<string, string>}
 */
const MIME_TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".tiff": "image/tiff",
  ".tif": "image/tiff",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
};

module.exports = {
  SUPPORTED_EXTENSIONS,
  IMAGE_EXTENSIONS,
  VIDEO_EXTENSIONS,
  MIME_TYPES,
};
