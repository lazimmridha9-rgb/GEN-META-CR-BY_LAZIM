const fs = require("fs");
const path = require("path");

const { batchFiles } = require("./files");
const { processBatch } = require("./wrapper");
const { Semaphore } = require("./semaphore");

const CONCURRENCY_LIMIT = 2;

/**
 * Process batches of media files with a concurrency limit
 * @param {object[]} images - Array of media file objects
 * @param {object} options - Processing options
 * @param {string|string[]} apiKeys - API key(s) for processing
 * @param {string} gsPath - Ghostscript path
 * @returns {Promise<object[]>} Processing results
 */
async function processBatchWithConcurrencyLimit(
  images,
  options,
  apiKeys,
  gsPath,
) {
  const results = [];
  const totalImages = images.length;

  // Check if processing was stopped
  if (
    global.processingState &&
    global.processingState.isProcessingStopped
  ) {
    return images.map((image) => ({
      filename: image.filename || path.basename(image.path),
      error: "Processing was stopped by user request",
      status: "cancelled",
    }));
  }

  // Extract callback from options
  const { onImageProcessed, ...processingOptions } = options;

  // Group files into batches
  const mediaBatches = batchFiles(images);

  // Ensure apiKeys is an array
  const availableApiKeys = Array.isArray(apiKeys) ? apiKeys : [apiKeys];

  // Distribute keys and models across batches
  const { distributeKeysAndModels } = require("../../tracking");
  const distribution = distributeKeysAndModels(
    availableApiKeys,
    mediaBatches.length,
  );

  console.log(
    `\n[Processing] ${totalImages} files in ${mediaBatches.length} batches | ` +
      `Plan: Premium | Models: gemini-2.5-flash/lite | Local Tracking: ON | Server Tracking: ON | Retry: ON`,
  );

  // Process batches with concurrency limit
  const semaphore = new Semaphore(CONCURRENCY_LIMIT);

  const processPromises = mediaBatches.map(async (batch, batchIndex) => {
    const assignment = distribution[batchIndex];
    const assignedApiKey = assignment.apiKey;
    const assignedModel = assignment.model;

    // Check stop state before acquiring semaphore
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

    const release = await semaphore.acquire();

    try {
      // Check stop state after acquiring semaphore
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

      // Verify files exist
      const validImages = batch.filter(
        (item) => item.path && fs.existsSync(item.path),
      );

      if (validImages.length === 0) {
        console.error(
          `[Batch ${batchIndex + 1}/${mediaBatches.length}] ✗ No valid files found`,
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
        availableApiKeys,
      );

      return batchResults;
    } catch (error) {
      console.error(
        `[Batch ${batchIndex + 1}/${mediaBatches.length}] ✗ Error: ${error.message}`,
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

  // Wait for all batches to complete
  const allResults = await Promise.allSettled(processPromises);

  // Aggregate results
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
        `[Batch Processing] Batch ${index + 1} promise rejected: ${result.reason?.message}`,
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
      `✓ ${successCount} success | ✗ ${failedCount} failed | ⚠ ${cancelledCount} cancelled\n`,
  );

  return results;
}

module.exports = { processBatchWithConcurrencyLimit };
