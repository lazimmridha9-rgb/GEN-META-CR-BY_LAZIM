/**
 * Extracts API keys from settings, supporting both legacy single key and array format
 * @param {Object} settings - Settings object
 * @returns {string[]} Array of API keys
 */
const getApiKeys = (settings) => {
  if (settings.apiKeys?.length > 0) return settings.apiKeys;
  return settings.apiKey ? [settings.apiKey] : [];
};

/**
 * Selects an API key by index from the array
 * @param {string[]} apiKeys - Array of API keys
 * @param {number|null} keyIndex - Index to select, or null
 * @returns {string|null} Selected key or null
 */
const selectApiKeyByIndex = (apiKeys, keyIndex) => {
  if (keyIndex !== null && keyIndex >= 0 && keyIndex < apiKeys.length) {
    return apiKeys[keyIndex];
  }
  return null;
};

/**
 * Rotates API keys based on current time (changes every minute)
 * @param {string[]} apiKeys - Array of API keys
 * @returns {string} Rotated API key
 */
const rotateApiKey = (apiKeys) => {
  return apiKeys[Math.floor(Date.now() / 60000) % apiKeys.length];
};

/**
 * Gets a processing API key from settings using selection or rotation strategy
 * @param {Object} settings - Settings object
 * @param {string} planType - Plan type (unused but kept for API compatibility)
 * @param {number|null} keyIndex - Specific key index, or null for rotation
 * @param {string} aiAgent - AI agent type (default: 'gemini')
 * @returns {string|null} Selected API key or null if none available
 */
function getProcessingApiKey(settings, planType, keyIndex = null, aiAgent = 'gemini') {
  const apiKeys = getApiKeys(settings);

  if (apiKeys.length === 0) {
    console.warn('[API KEY] No gemini API keys available');
    return null;
  }

  const selectedKey = selectApiKeyByIndex(apiKeys, keyIndex);
  if (selectedKey) return selectedKey;

  return rotateApiKey(apiKeys);
}

module.exports = { getApiKeys, selectApiKeyByIndex, rotateApiKey, getProcessingApiKey };
