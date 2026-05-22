const BatchProcessor = require("../pipeline/batch-processor");

/**
 * Process a batch of media files through the pipeline
 * @param {object[]} batch - Array of media file objects
 * @param {object} options - Processing options
 * @param {string} apiKey - Assigned API key for this batch
 * @param {string} gsPath - Ghostscript path
 * @param {string|null} [assignedModel=null] - Assigned model for this batch
 * @param {boolean} [skipTracking=false] - Whether to skip usage tracking
 * @param {string[]|null} [allApiKeys=null] - All available keys for retry
 * @returns {Promise<object[]>} Processing results
 */
async function processBatch(
  batch,
  options,
  apiKey,
  gsPath,
  assignedModel = null,
  skipTracking = false,
  allApiKeys = null,
) {
  const processor = new BatchProcessor(apiKey, options, gsPath, allApiKeys);
  return await processor.processBatch(batch, assignedModel, skipTracking);
}

module.exports = { processBatch };
