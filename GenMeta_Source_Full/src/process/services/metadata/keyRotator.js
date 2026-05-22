const {
  getKeyStats,
  SUPPORTED_MODELS,
} = require("../../../utils/apiKeyTracker");
const getGeminiConfig = require("../../ai/config");
const { maskApiKey } = require("../../../shared/helpers/maskUtils");

/**
 * Builds a sorted list of alternative API key / model combinations for retry.
 * Prioritizes combos with no errors, then sorts by error count and success count.
 *
 * @param {string} currentApiKey - Currently active API key.
 * @param {string} currentModel - Currently active model.
 * @param {Array<string>} apiKeys - All available API keys.
 * @returns {Array<Object>} Sorted retry combinations.
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

  // Sort: no errors first, then fewer errors, then more successes
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
 * Checks whether an error is related to API quota or rate limiting.
 *
 * @param {Error} error - The error to check.
 * @returns {boolean} True if the error is quota-related.
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
 * Switches to a different API key and model, returning a new Gemini config.
 *
 * @param {string} apiKey - The new API key.
 * @param {string} model - The new model name.
 * @returns {{ genAI: Object, model: string, generationConfig: Object }} New Gemini config.
 */
function switchToKeyAndModel(apiKey, model) {
  const { genAI, model: modelName, generationConfig } = getGeminiConfig(
    apiKey,
    model
  );
  return { genAI, model: modelName, generationConfig };
}

module.exports = { buildRetryList, isQuotaError, switchToKeyAndModel };
