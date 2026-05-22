/**
 * Sanitizes a string to be safe for use as a filename
 * @param {string} filename - The filename to sanitize
 * @param {number} maxLength - Maximum allowed length (default: 255)
 * @returns {string} Sanitized filename
 */
function sanitizeFilename(filename, maxLength = 255) {
  if (!filename) return '';

  let sanitized = filename
    .replace(/[<>:"\\|?*]/g, '_')
    .replace(/\//g, '_')
    .replace(/^\.+/, '')
    .replace(/[.\s]+$/, '');

  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized || 'renamed_file';
}

module.exports = { sanitizeFilename };
