/**
 * Get all available API keys from settings (supports both single and multiple key formats)
 * @param {object} settings - Settings object
 * @returns {string[]} Array of API keys
 */
const getApiKeys = (settings) => {
  if (settings.apiKeys?.length > 0) return settings.apiKeys;
  return settings.apiKey ? [settings.apiKey] : [];
};

/**
 * Select a specific API key by index
 * @param {string[]} apiKeys - Array of API keys
 * @param {number|null} keyIndex - Index to select, or null for first key
 * @returns {string|null} Selected key or null
 */
const selectApiKeyByIndex = (apiKeys, keyIndex) => {
  if (keyIndex !== null && keyIndex >= 0 && keyIndex < apiKeys.length) {
    return apiKeys[keyIndex];
  }
  return null;
};

/**
 * Rotate API key based on time (changes every minute)
 * @param {string[]} apiKeys - Array of API keys
 * @returns {string} Rotated key
 */
const rotateApiKey = (apiKeys) => {
  return apiKeys[Math.floor(Date.now() / 60000) % apiKeys.length];
};

/**
 * Get an API key for processing based on settings and optional index
 * @param {object} settings - Settings object
 * @param {string} planType - User's plan type
 * @param {number|null} keyIndex - Specific key index to use
 * @returns {string|null} Selected API key or null
 */
function getProcessingApiKey(settings, planType, keyIndex = null) {
  const apiKeys = getApiKeys(settings);

  if (apiKeys.length === 0) {
    console.warn("[API KEY] No gemini API keys available");
    return null;
  }

  const selectedKey = selectApiKeyByIndex(apiKeys, keyIndex);
  if (selectedKey) return selectedKey;

  return rotateApiKey(apiKeys);
}

module.exports = { getApiKeys, getProcessingApiKey, rotateApiKey, selectApiKeyByIndex };
