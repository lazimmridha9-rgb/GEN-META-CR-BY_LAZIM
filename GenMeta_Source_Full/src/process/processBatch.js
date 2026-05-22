const BatchProcessor = require("./services/BatchProcessor");

/**
 * Processes a batch of media files through the full pipeline:
 * media preparation, metadata generation, and result processing.
 *
 * @param {Array<Object>} batch - Array of media file objects.
 * @param {Object} options - Processing options.
 * @param {string} apiKey - The API key assigned to this batch.
 * @param {string|null} gsPath - Ghostscript executable path (for EPS conversion).
 * @param {string|null} [assignedModel=null] - The model assigned to this batch.
 * @param {boolean} [skipTracking=false] - Whether to skip usage tracking.
 * @param {Array<string>|null} [allApiKeys=null] - All available API keys for retry logic.
 * @returns {Promise<Array<Object>>} Array of processing results.
 */
async function processBatch(
  batch,
  options,
  apiKey,
  gsPath,
  assignedModel = null,
  skipTracking = false,
  allApiKeys = null
) {
  // Use the assigned key for this batch, but pass all keys for retry logic
  const processor = new BatchProcessor(apiKey, options, gsPath, allApiKeys);
  return processor.processBatch(batch, assignedModel, skipTracking);
}

module.exports = { processBatch };
