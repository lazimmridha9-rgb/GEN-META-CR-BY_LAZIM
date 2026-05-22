// Local modules
const { SUPPORTED_MODELS } = require("./models");
const { maskApiKey } = require("./mask");
const { loadTrackerData, hashApiKey } = require("./storage");

/**
 * Distributes API keys and models across a batch of requests,
 * prioritizing unused combos, then successful ones, and finally error-prone ones.
 *
 * @param {string[]} apiKeys - Array of API keys to distribute.
 * @param {number} batchCount - Number of batches to distribute.
 * @returns {Array<{apiKey: string, model: string, batchIndex: number}>} Distribution assignments.
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
      const stats = data.keys[comboKey] || { successCount: 0, errorCount: 0, lastError: null };
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

  // Sort combos: unused first, then by error count, then by success count
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

  // Categorize combos for prioritized distribution
  const unusedCombos = keyModelCombos.filter((c) => c.totalUsage === 0);
  const successOnlyCombos = keyModelCombos.filter((c) => c.errorCount === 0 && c.successCount > 0);
  const errorCombos = keyModelCombos.filter((c) => c.errorCount > 0);

  // Limit how often error-prone combos are used
  const errorKeyLimit = errorCombos.length > 0
    ? Math.max(1, Math.floor(batchCount / (apiKeys.length * availableModels.length)))
    : 0;

  // Distribute batches across combos
  let batchIndex = 0;
  let unusedIndex = 0;
  let successIndex = 0;
  let errorIndex = 0;
  const errorUsageCount = new Map();

  while (batchIndex < batchCount) {
    let combo = null;

    if (unusedCombos.length > 0) {
      // Prioritize unused key-model combinations
      combo = unusedCombos[unusedIndex % unusedCombos.length];
      unusedIndex++;
    } else if (successOnlyCombos.length > 0) {
      // Then use combos with only successful requests
      combo = successOnlyCombos[successIndex % successOnlyCombos.length];
      successIndex++;
    } else if (errorCombos.length > 0) {
      // Finally, retry error combos with rate limiting
      for (let i = 0; i < errorCombos.length; i++) {
        const testCombo = errorCombos[(errorIndex + i) % errorCombos.length];
        const comboKey = `${testCombo.apiKey}-${testCombo.model}`;
        if ((errorUsageCount.get(comboKey) || 0) < errorKeyLimit) {
          combo = testCombo;
          errorUsageCount.set(comboKey, (errorUsageCount.get(comboKey) || 0) + 1);
          errorIndex = (errorIndex + i + 1) % errorCombos.length;
          break;
        }
      }

      // Fallback: use error combo even if limit exceeded
      if (!combo) {
        combo = errorCombos[errorIndex % errorCombos.length];
        const comboKey = `${combo.apiKey}-${combo.model}`;
        errorUsageCount.set(comboKey, (errorUsageCount.get(comboKey) || 0) + 1);
        errorIndex++;
      }
    } else {
      // Last resort: use the first combo
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
 * Finds the next best model for a given API key when the current model has errors.
 *
 * @param {string} apiKey - The API key to check.
 * @param {string} currentModel - The currently used model.
 * @returns {string} The recommended model (either current or next alternative).
 */
function getNextBestModel(apiKey, currentModel) {
  const data = loadTrackerData();
  const keyHash = hashApiKey(apiKey);
  const modelIndex = SUPPORTED_MODELS.indexOf(currentModel);
  const nextIndex = (modelIndex + 1) % SUPPORTED_MODELS.length;
  const otherModel = SUPPORTED_MODELS[nextIndex];

  const currentErrorCount = (data.keys[`${keyHash}:${currentModel}`] || {}).errorCount || 0;
  const otherErrorCount = (data.keys[`${keyHash}:${otherModel}`] || {}).errorCount || 0;

  return (currentErrorCount > 0 && otherErrorCount < currentErrorCount)
    ? otherModel
    : currentModel;
}

module.exports = { distributeKeysAndModels, getNextBestModel };
