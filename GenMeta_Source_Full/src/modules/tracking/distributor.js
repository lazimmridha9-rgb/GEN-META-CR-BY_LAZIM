const { SUPPORTED_MODELS } = require("../../config/models");

const { hashApiKey, loadTrackerData } = require("./storage");
const { maskApiKey } = require("./mask");

/**
 * Distribute API key-model combinations across batches using usage-based intelligence
 * @param {string[]} apiKeys - Available API keys
 * @param {number} batchCount - Number of batches to distribute
 * @returns {{ apiKey: string, model: string, batchIndex: number }[]} Distribution array
 */
function distributeKeysAndModels(apiKeys, batchCount) {
  const data = loadTrackerData();
  const distribution = [];
  const availableModels = SUPPORTED_MODELS;

  // Build all key-model combinations with their usage stats
  const keyModelCombos = [];
  for (const apiKey of apiKeys) {
    const keyHash = hashApiKey(apiKey);
    for (const model of availableModels) {
      const comboKey = `${keyHash}:${model}`;
      const stats = data.keys[comboKey] || {
        successCount: 0,
        errorCount: 0,
        lastError: null,
      };
      keyModelCombos.push({
        apiKey,
        model,
        successCount: stats.successCount || 0,
        errorCount: stats.errorCount || 0,
        lastError: stats.lastError || null,
        totalUsage: (stats.successCount || 0) + (stats.errorCount || 0),
      });
    }
  }

  // Sort: unused first, then error-free (by success count), then error combos (by error count)
  keyModelCombos.sort((a, b) => {
    if (a.totalUsage === 0 && b.totalUsage !== 0) return -1;
    if (a.totalUsage !== 0 && b.totalUsage === 0) return 1;
    if (a.totalUsage === 0 && b.totalUsage === 0) return 0;

    const aHasErrors = a.errorCount > 0;
    const bHasErrors = b.errorCount > 0;

    if (!aHasErrors && bHasErrors) return -1;
    if (aHasErrors && !bHasErrors) return 1;
    if (!aHasErrors && !bHasErrors) return a.successCount - b.successCount;
    return a.errorCount - b.errorCount;
  });

  // Categorize combos for round-robin distribution
  const unusedCombos = keyModelCombos.filter((c) => c.totalUsage === 0);
  const successOnlyCombos = keyModelCombos.filter(
    (c) => c.errorCount === 0 && c.successCount > 0,
  );
  const errorCombos = keyModelCombos.filter((c) => c.errorCount > 0);

  // Limit how often error combos are used
  const errorKeyLimit =
    errorCombos.length > 0
      ? Math.max(1, Math.floor(batchCount / (apiKeys.length * availableModels.length)))
      : 0;

  let batchIndex = 0;
  let unusedIndex = 0;
  let successIndex = 0;
  let errorIndex = 0;
  const errorUsageCount = new Map();

  while (batchIndex < batchCount) {
    let combo = null;

    if (unusedCombos.length > 0) {
      combo = unusedCombos[unusedIndex % unusedCombos.length];
      unusedIndex++;
    } else if (successOnlyCombos.length > 0) {
      combo = successOnlyCombos[successIndex % successOnlyCombos.length];
      successIndex++;
    } else if (errorCombos.length > 0) {
      // Try to find an error combo under its usage limit
      for (let i = 0; i < errorCombos.length; i++) {
        const testCombo = errorCombos[(errorIndex + i) % errorCombos.length];
        const comboKey = `${testCombo.apiKey}-${testCombo.model}`;
        if ((errorUsageCount.get(comboKey) || 0) < errorKeyLimit) {
          combo = testCombo;
          errorUsageCount.set(
            comboKey,
            (errorUsageCount.get(comboKey) || 0) + 1,
          );
          errorIndex = (errorIndex + i + 1) % errorCombos.length;
          break;
        }
      }
      // Fallback: use next error combo regardless of limit
      if (!combo) {
        combo = errorCombos[errorIndex % errorCombos.length];
        const comboKey = `${combo.apiKey}-${combo.model}`;
        errorUsageCount.set(
          comboKey,
          (errorUsageCount.get(comboKey) || 0) + 1,
        );
        errorIndex++;
      }
    } else {
      combo = keyModelCombos[0];
    }

    distribution.push({ apiKey: combo.apiKey, model: combo.model, batchIndex });
    batchIndex++;
  }

  // Log distribution summary
  const summary = new Map();
  distribution.forEach((d) => {
    const key = `${maskApiKey(d.apiKey)} + ${d.model}`;
    summary.set(key, (summary.get(key) || 0) + 1);
  });
  console.log("[API Distribution] Batch assignments:");
  summary.forEach((count, key) => console.log(`  ${key}: ${count} batches`));

  return distribution;
}

/**
 * Get the next best model for a given key, preferring models with fewer errors
 * @param {string} apiKey - The API key
 * @param {string} currentModel - Current model in use
 * @returns {string} Best model to use
 */
function getNextBestModel(apiKey, currentModel) {
  const data = loadTrackerData();
  const keyHash = hashApiKey(apiKey);
  const modelIndex = SUPPORTED_MODELS.indexOf(currentModel);
  const nextIndex = (modelIndex + 1) % SUPPORTED_MODELS.length;
  const otherModel = SUPPORTED_MODELS[nextIndex];

  const currentErrorCount =
    (data.keys[`${keyHash}:${currentModel}`] || {}).errorCount || 0;
  const otherErrorCount =
    (data.keys[`${keyHash}:${otherModel}`] || {}).errorCount || 0;

  return currentErrorCount > 0 && otherErrorCount < currentErrorCount
    ? otherModel
    : currentModel;
}

module.exports = { distributeKeysAndModels, getNextBestModel };
