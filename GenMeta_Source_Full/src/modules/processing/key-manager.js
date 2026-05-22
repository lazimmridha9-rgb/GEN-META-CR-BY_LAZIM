const { maskApiKey } = require("../../shared/helpers/mask-utils");

/**
 * Get all available processing API keys from settings
 * @param {object} settings - Settings object
 * @returns {string[]} Array of valid API keys
 */
function getAllProcessingApiKeys(settings) {
  const apiKeys =
    settings.apiKeys && settings.apiKeys.length > 0
      ? settings.apiKeys.filter((key) => key && key.trim())
      : settings.apiKey
        ? [settings.apiKey]
        : [];

  apiKeys.forEach((key, index) =>
    console.log(`  Key ${index + 1}: ${maskApiKey(key)}`),
  );

  return apiKeys;
}

/**
 * Get a single processing API key by index (defaults to first)
 * @param {object} settings - Settings object
 * @param {number|null} [keyIndex=null] - Index of key to retrieve
 * @returns {string|null} Selected API key or null
 */
function getProcessingApiKey(settings, keyIndex = null) {
  const apiKeys =
    settings.apiKeys && settings.apiKeys.length > 0
      ? settings.apiKeys
      : settings.apiKey
        ? [settings.apiKey]
        : [];

  if (apiKeys.length === 0) {
    console.warn("[API KEY] No API keys available");
    return null;
  }

  if (keyIndex !== null && keyIndex >= 0 && keyIndex < apiKeys.length) {
    return apiKeys[keyIndex];
  }

  return apiKeys[0];
}

module.exports = { getAllProcessingApiKeys, getProcessingApiKey };
