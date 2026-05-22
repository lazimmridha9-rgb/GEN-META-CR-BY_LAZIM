// Local modules
const { SUPPORTED_MODELS } = require("./models");
const { loadTrackerData, saveTrackerData, hashApiKey } = require("./storage");

/**
 * Creates a default stats object for a key-model combination.
 *
 * @returns {Object} Initial stats with zero counts.
 */
function initializeKeyModelData() {
  return { successCount: 0, errorCount: 0, lastError: null };
}

/**
 * Records a successful API request for a key-model combination.
 * Resets error count on success.
 *
 * @param {string} apiKey - The API key used.
 * @param {string} model - The model that was called.
 */
function trackSuccess(apiKey, model) {
  if (!SUPPORTED_MODELS.includes(model)) {
    console.warn(`[API Tracker] Unsupported model "${model}", skipping tracking`);
    return;
  }

  const data = loadTrackerData();
  const comboKey = `${hashApiKey(apiKey)}:${model}`;

  if (!data.keys[comboKey]) {
    data.keys[comboKey] = initializeKeyModelData();
  }

  const entry = data.keys[comboKey];
  entry.successCount++;
  entry.errorCount = 0;
  entry.lastError = null;
  saveTrackerData(data);
}

/**
 * Records a failed API request for a key-model combination.
 *
 * @param {string} apiKey - The API key used.
 * @param {string} model - The model that was called.
 * @param {string} error - The error message.
 */
function trackError(apiKey, model, error) {
  if (!SUPPORTED_MODELS.includes(model)) {
    console.warn(`[API Tracker] Unsupported model "${model}", skipping error tracking`);
    return;
  }

  const data = loadTrackerData();
  const comboKey = `${hashApiKey(apiKey)}:${model}`;

  if (!data.keys[comboKey]) {
    data.keys[comboKey] = initializeKeyModelData();
  }

  const entry = data.keys[comboKey];
  entry.errorCount++;
  entry.lastError = error;
  saveTrackerData(data);
}

/**
 * Gets the stats for a specific key-model combination.
 *
 * @param {string} apiKey - The API key.
 * @param {string} model - The model name.
 * @returns {Object} Stats object with successCount, errorCount, and lastError.
 */
function getKeyStats(apiKey, model) {
  const data = loadTrackerData();
  const comboKey = `${hashApiKey(apiKey)}:${model}`;
  const stats = data.keys[comboKey];

  if (!stats || typeof stats !== "object") {
    return { successCount: 0, errorCount: 0, lastError: null };
  }

  return {
    successCount: stats.successCount || 0,
    errorCount: stats.errorCount || 0,
    lastError: stats.lastError || null,
  };
}

/**
 * Returns all tracked key-model stats.
 *
 * @returns {Object} The full tracker data object.
 */
function getAllKeyStats() {
  return loadTrackerData();
}

module.exports = { trackSuccess, trackError, getKeyStats, getAllKeyStats };
