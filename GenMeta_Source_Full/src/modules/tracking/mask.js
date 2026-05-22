/**
 * Mask an API key for safe display in logs and UI
 * Shows first 4 and last 4 characters, masking the middle
 * @param {string} apiKey - The API key to mask
 * @returns {string} Masked key or "***" if too short
 */
function maskApiKey(apiKey) {
  if (!apiKey || apiKey.length < 8) return "***";
  return `${apiKey.substring(0, 4)}***${apiKey.substring(apiKey.length - 4)}`;
}

module.exports = { maskApiKey };
