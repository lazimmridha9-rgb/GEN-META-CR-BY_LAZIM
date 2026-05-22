const fs = require("fs");
const path = require("path");

const { Semaphore } = require("./semaphore");
const { processBatch } = require("./processBatch");
const { batchFiles } = require("./batchFiles");

// Concurrency limit for parallel batch processing
const CONCURRENCY_LIMIT = 2;

/**
 * Processes media files in batches with a concurrency limit.
 * Distributes API keys and models using the premium plan tracker.
 *
 * @param {Array<Object>} images - Array of media file objects.
 * @param {Object} options - Processing options (may include onImageProcessed callback).
 * @param {Array<string>|string} apiKeys - One or more API keys for rotation.
 * @param {string|null} gsPath - Ghostscript executable path.
 * @returns {Promise<Array<Object>>} Array of processing results for all files.
 */
async function processBatchWithConcurrencyLimit(
  images,
  options,
  apiKeys,
  gsPath
) {
  const results = [];
  const totalImages = images.length;

  // Check if processing has been stopped before starting
  if (global.processingState && global.processingState.isProcessingStopped) {
    return images.map((image) => ({
      filename: image.filename || path.basename(image.path),
      error: "Processing was stopped by user request",
      status: "cancelled",
    }));
  }

  // Extract the progress callback from options
  const { onImageProcessed, ...processingOptions } = options;

  // Group files into batches by format
  const mediaBatches = batchFiles(images);

  // Ensure apiKeys is an array
  const availableApiKeys = Array.isArray(apiKeys) ? apiKeys : [apiKeys];

  // Premium plan: Intelligent distribution with local tracking for key rotation
  const { distributeKeysAndModels } = require("../utils/apiKeyTracker");
  const distribution = distributeKeysAndModels(
    availableApiKeys,
    mediaBatches.length
  );

  console.log(
    `\n[Processing] ${totalImages} files in ${mediaBatches.length} batches | ` +
      `Plan: Premium | Models: gemini-2.5-flash/lite | Local Tracking: ON | Server Tracking: ON | Retry: ON`
  );

  // Process batches with concurrency limit using a semaphore
  const semaphore = new Semaphore(CONCURRENCY_LIMIT);
  const processPromises = mediaBatches.map(async (batch, batchIndex) => {
    // Get the assigned API key and model for this batch
    const assignment = distribution[batchIndex];
    const assignedApiKey = assignment.apiKey;
    const assignedModel = assignment.model;

    // Check if processing stopped before acquiring semaphore
    if (global.processingState && global.processingState.isProcessingStopped) {
      if (typeof onImageProcessed === "function") {
        batch.forEach(() => onImageProcessed());
      }
      return batch.map((item) => ({
        filename:
          item.originalname || item.filename || path.basename(item.path),
        error: "Processing was stopped by user request",
        status: "cancelled",
      }));
    }

    const release = await semaphore.acquire();

    try {
      // Check again after acquiring semaphore
      if (
        global.processingState &&
        global.processingState.isProcessingStopped
      ) {
        if (typeof onImageProcessed === "function") {
          batch.forEach(() => onImageProcessed());
        }
        return batch.map((item) => ({
          filename:
            item.originalname || item.filename || path.basename(item.path),
          error: "Processing was stopped by user request",
          status: "cancelled",
        }));
      }

      // Verify files exist before processing
      const validImages = batch.filter(
        (item) => item.path && fs.existsSync(item.path)
      );

      if (validImages.length === 0) {
        console.error(
          `[Batch ${batchIndex + 1}/${mediaBatches.length}] No valid files found`
        );

        if (typeof onImageProcessed === "function") {
          batch.forEach(() => onImageProcessed());
        }

        return batch.map((item) => ({
          filename: item.originalname || item.filename,
          error: `File not found: ${item.path}`,
          status: "failed",
        }));
      }

      // Build batch options with the assigned model
      const skipTracking = assignment.skipTracking || false;
      const batchOptions = {
        ...processingOptions,
        geminiModel: assignedModel,
        onBatchComplete: () => {
          if (typeof onImageProcessed === "function") {
            validImages.forEach(() => onImageProcessed());
          }
        },
      };

      const batchResults = await processBatch(
        validImages,
        batchOptions,
        assignedApiKey,
        gsPath,
        assignedModel,
        skipTracking,
        availableApiKeys // Pass all keys for smart retry
      );

      return batchResults;
    } catch (error) {
      console.error(
        `[Batch ${batchIndex + 1}/${mediaBatches.length}] Error: ${error.message}`
      );

      if (typeof onImageProcessed === "function") {
        batch.forEach(() => onImageProcessed());
      }

      return batch.map((item) => ({
        filename: item.originalname || item.filename,
        error: error.message || "Unknown error",
        status: "failed",
      }));
    } finally {
      release();
    }
  });

  // Wait for all batch promises to settle
  const allResults = await Promise.allSettled(processPromises);

  // Aggregate results and count statuses
  let successCount = 0;
  let failedCount = 0;
  let cancelledCount = 0;

  allResults.forEach((result, index) => {
    if (result.status === "fulfilled") {
      results.push(...result.value);

      result.value.forEach((item) => {
        if (item.status === "cancelled") cancelledCount++;
        else if (item.status === "failed" || item.error) failedCount++;
        else successCount++;
      });
    } else {
      console.error(
        `[Batch Processing] Batch ${index + 1} rejected: ${result.reason?.message}`
      );
      results.push({
        filename: "unknown",
        error: result.reason?.message || "Unknown error",
        status: "failed",
      });
      failedCount++;

      if (typeof onImageProcessed === "function") {
        onImageProcessed();
      }
    }
  });

  console.log(
    `[Processing Complete] ${results.length} files | ` +
      `Success: ${successCount} | Failed: ${failedCount} | Cancelled: ${cancelledCount}\n`
  );

  return results;
}

module.exports = { processBatchWithConcurrencyLimit };
