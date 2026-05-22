const { SUPPORTED_MODELS } = require("../../config/models");

const { hashApiKey, loadTrackerData, saveTrackerData } = require("./storage");

/**
 * Initialize a fresh key-model tracking entry
 * @returns {{ successCount: number, errorCount: number, lastError: null }}
 */
function initializeKeyModelData() {
  return { successCount: 0, errorCount: 0, lastError: null };
}

/**
 * Track a successful API call for a key-model combination
 * @param {string} apiKey - The API key used
 * @param {string} model - The model used
 */
function trackSuccess(apiKey, model) {
  if (!SUPPORTED_MODELS.includes(model)) {
    console.warn(
      `[API Tracker] Unsupported model "${model}", skipping tracking`,
    );
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
 * Track a failed API call for a key-model combination
 * @param {string} apiKey - The API key used
 * @param {string} model - The model used
 * @param {string} error - Error message
 */
function trackError(apiKey, model, error) {
  if (!SUPPORTED_MODELS.includes(model)) {
    console.warn(
      `[API Tracker] Unsupported model "${model}", skipping error tracking`,
    );
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
 * Get usage stats for a specific key-model combination
 * @param {string} apiKey - The API key
 * @param {string} model - The model
 * @returns {{ successCount: number, errorCount: number, lastError: string|null }}
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
 * Get all tracked key-model statistics
 * @returns {{ date: string, keys: object }} All tracker data
 */
function getAllKeyStats() {
  return loadTrackerData();
}

module.exports = { getAllKeyStats, getKeyStats, trackError, trackSuccess };
