const { maskApiKey } = require('../../../shared/helpers/maskUtils');

/**
 * Gets all processing API keys from settings, logging masked versions
 * @param {Object} settings - Settings object
 * @returns {string[]} Array of API keys
 */
function getAllProcessingApiKeys(settings) {
  const apiKeys = settings.apiKeys && settings.apiKeys.length > 0
    ? settings.apiKeys.filter((key) => key && key.trim())
    : settings.apiKey ? [settings.apiKey] : [];

  apiKeys.forEach((key, index) => {
    console.log(`  Key ${index + 1}: ${maskApiKey(key)}`);
  });

  return apiKeys;
}

/**
 * Gets a single processing API key by index or defaults to first
 * @param {Object} settings - Settings object
 * @param {number|null} keyIndex - Specific key index, or null
 * @returns {string|null} Selected API key or null
 */
function getProcessingApiKey(settings, keyIndex = null) {
  const apiKeys = settings.apiKeys && settings.apiKeys.length > 0
    ? settings.apiKeys
    : settings.apiKey ? [settings.apiKey] : [];

  if (apiKeys.length === 0) {
    console.warn('[API KEY] No API keys available');
    return null;
  }

  if (keyIndex !== null && keyIndex >= 0 && keyIndex < apiKeys.length) {
    return apiKeys[keyIndex];
  }

  return apiKeys[0];
}

module.exports = { getAllProcessingApiKeys, getProcessingApiKey };
