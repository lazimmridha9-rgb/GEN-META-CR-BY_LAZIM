const { SUPPORTED_MODELS, getKeyStats } = require("../tracking");
const getGeminiConfig = require("../ai/client");
const { maskApiKey } = require("../../shared/helpers/mask-utils");

/**
 * Build a sorted list of alternative key-model combinations for retry
 * @param {string} currentApiKey - Current API key in use
 * @param {string} currentModel - Current model in use
 * @param {string[]} apiKeys - All available API keys
 * @returns {object[]} Sorted retry combinations
 */
function buildRetryList(currentApiKey, currentModel, apiKeys) {
  const retryCombos = [];

  for (const apiKey of apiKeys) {
    for (const model of SUPPORTED_MODELS) {
      if (apiKey === currentApiKey && model === currentModel) continue;

      const stats = getKeyStats(apiKey, model);
      retryCombos.push({
        apiKey,
        model,
        errorCount: stats.errorCount,
        successCount: stats.successCount,
      });
    }
  }

  // Sort: error-free first (by success count), then error combos
  retryCombos.sort((a, b) => {
    const aHasErrors = a.errorCount > 0;
    const bHasErrors = b.errorCount > 0;

    if (!aHasErrors && bHasErrors) return -1;
    if (aHasErrors && !bHasErrors) return 1;
    if (!aHasErrors && !bHasErrors) return a.successCount - b.successCount;
    if (a.errorCount !== b.errorCount) return a.errorCount - b.errorCount;
    return a.successCount - b.successCount;
  });

  return retryCombos;
}

/**
 * Check if an error is a quota/rate limit error
 * @param {Error} error - Error object
 * @returns {boolean}
 */
function isQuotaError(error) {
  const msg = error.message?.toLowerCase() || "";
  return (
    msg.includes("quota") ||
    msg.includes("rate limit") ||
    msg.includes("429") ||
    msg.includes("resource exhausted")
  );
}

/**
 * Create a new Gemini config with a different key and model
 * @param {string} apiKey - New API key
 * @param {string} model - New model
 * @returns {{ genAI: object, model: string, generationConfig: object }}
 */
function switchToKeyAndModel(apiKey, model) {
  const { genAI, model: modelName, generationConfig } = getGeminiConfig(
    apiKey,
    model,
  );
  return { genAI, model: modelName, generationConfig };
}

module.exports = { buildRetryList, isQuotaError, switchToKeyAndModel };
