/**
 * Masks an API key for safe display, showing only the first and last 4 characters.
 *
 * @param {string} apiKey - The API key to mask.
 * @returns {string} Masked API key (e.g., "sk-a***xyz1") or "***" if too short.
 */
function maskApiKey(apiKey) {
  if (!apiKey || apiKey.length < 8) {
    return "***";
  }
  return apiKey.substring(0, 4) + "***" + apiKey.substring(apiKey.length - 4);
}

module.exports = { maskApiKey };
