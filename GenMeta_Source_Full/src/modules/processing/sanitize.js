/**
 * Sanitize a filename by removing or replacing invalid characters
 * @param {string} filename - Original filename
 * @param {number} [maxLength=255] - Maximum allowed length
 * @returns {string} Sanitized filename
 */
function sanitizeFilename(filename, maxLength = 255) {
  if (!filename) return "";

  let sanitized = filename
    .replace(/[<>:"\\|?*]/g, "_")
    .replace(/\//g, "_")
    .replace(/^\.+/, "")
    .replace(/[.\s]+$/, "");

  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized || "renamed_file";
}

module.exports = { sanitizeFilename };
