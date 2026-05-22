const { preloadBackgroundImage } = require("../utils/imageUtils");
const { cleanupTempFilesAsync } = require("../cleanupTempFilesAsync");
const ProcessingStateManager = require("./ProcessingStateManager");
const MediaProcessor = require("./MediaProcessor");
const MetadataProcessor = require("./MetadataProcessor");
const ResultProcessor = require("./ResultProcessor");
const path = require("path");

/**
 * Orchestrates the processing of a batch of media files through
 * media preparation, metadata generation, and result processing.
 */
class BatchProcessor {
  /**
   * Creates a new BatchProcessor.
   *
   * @param {string} assignedApiKey - The API key assigned to this batch.
   * @param {Object} options - Processing options.
   * @param {string} gsPath - Ghostscript executable path.
   * @param {Array<string>|null} [allApiKeys=null] - All available API keys for retry.
   */
  constructor(assignedApiKey, options, gsPath, allApiKeys = null) {
    this.assignedApiKey = assignedApiKey;
    this.allApiKeys = allApiKeys || [assignedApiKey];
    this.options = options;
    this.gsPath = gsPath;

    this.mediaProcessor = new MediaProcessor(gsPath);

    // Reorder keys so assigned key is first (avoids double logging)
    const reorderedKeys = this._reorderKeysWithAssignedFirst(
      this.allApiKeys,
      assignedApiKey
    );

    this.metadataProcessor = new MetadataProcessor(reorderedKeys, options);

    this.resultProcessor = new ResultProcessor(
      this.mediaProcessor,
      this.metadataProcessor
    );

    // Store MetadataProcessor class for recreation if needed
    this.MetadataProcessor = MetadataProcessor;
  }

  /**
   * Reorders the API keys array so the assigned key comes first.
   *
   * @param {Array<string>} keys - All available API keys.
   * @param {string} assignedKey - The key to prioritize.
   * @returns {Array<string>} Reordered keys array.
   */
  _reorderKeysWithAssignedFirst(keys, assignedKey) {
    if (!keys.includes(assignedKey)) {
      return keys;
    }
    const otherKeys = keys.filter((k) => k !== assignedKey);
    return [assignedKey, ...otherKeys];
  }

  /**
   * Processes a batch of media files.
   *
   * @param {Array<Object>} batch - Array of media file objects.
   * @param {string|null} [assignedModel=null] - Model assigned to this batch.
   * @param {boolean} [skipTracking=false] - Whether to skip usage tracking.
   * @returns {Promise<Array<Object>>} Array of processing results.
   */
  async processBatch(batch, assignedModel = null, skipTracking = false) {
    let tempFiles = [];
    const effectiveModel = assignedModel || this.options.geminiModel;

    try {
      await this._preloadBackground();

      if (ProcessingStateManager.isProcessingStopped()) {
        return this._createCancelledBatch(batch);
      }

      // Process media (images and videos)
      const preparedMedia = await this.mediaProcessor.prepareMedia(batch);
      tempFiles = this.mediaProcessor.getTempFiles();

      // Generate metadata
      let metadataArray;

      try {
        // Override model if assigned
        const processingOptions = assignedModel
          ? { ...this.options, geminiModel: assignedModel }
          : this.options;

        // Recreate metadata processor if model changed
        if (assignedModel && assignedModel !== this.options.geminiModel) {
          const reorderedKeys = this._reorderKeysWithAssignedFirst(
            this.allApiKeys,
            this.assignedApiKey
          );
          this.metadataProcessor = new this.MetadataProcessor(
            reorderedKeys,
            processingOptions
          );
        }

        metadataArray = await this.metadataProcessor.processMetadata(
          preparedMedia
        );

        this._trackSuccessfulBatch(preparedMedia.length, effectiveModel);
      } catch (error) {
        this._trackFailedBatch(preparedMedia, error, effectiveModel);

        // Create failed results and emit them immediately
        const failedResults = preparedMedia.map((item) => {
          const result = {
            filename:
              item.originalMedia.originalname ||
              path.basename(item.originalMedia.path),
            error: error.message || "Unknown error",
            status: "failed",
            originalPath: item.originalMedia.path,
            previewPath: item.originalMedia.path,
            mediaType: item.mediaType,
            isVideo: item.mediaType === "video",
          };

          this._emitResultImmediately(result);
          return result;
        });

        this._cleanup(tempFiles);
        this._notifyBatchComplete();

        return failedResults;
      }

      // Process results (apply metadata, create copies)
      const results = await this.resultProcessor.processResults(
        preparedMedia,
        metadataArray,
        this.options
      );

      this._cleanup(tempFiles);
      this._notifyBatchComplete();

      return results;
    } catch (error) {
      this._cleanup(tempFiles);
      this._notifyBatchComplete();

      return this._createErrorBatch(batch, error);
    }
  }

  /**
   * Preloads the background image for EPS/SVG conversions.
   */
  async _preloadBackground() {
    try {
      await preloadBackgroundImage();
    } catch (error) {
      console.warn(
        "Warning: Failed to preload background image. Processing will continue but may encounter issues:",
        error.message
      );
    }
  }

  /**
   * Tracks a successful batch in the processing handler and API key tracker.
   *
   * @param {number} fileCount - Number of files processed.
   * @param {string} model - Model used.
   */
  _trackSuccessfulBatch(fileCount, model) {
    try {
      const { trackSuccessfulBatch } = require("../../handlers/processingHandler");
      trackSuccessfulBatch(fileCount);

      const { trackSuccess } = require("../../utils/apiKeyTracker");
      const actualKeyUsed = this.metadataProcessor.apiKey;
      trackSuccess(actualKeyUsed, model);
    } catch (error) {
      console.warn(
        "[BatchProcessor] Failed to track successful batch:",
        error.message
      );
    }
  }

  /**
   * Tracks a failed batch in the processing handler and API key tracker.
   *
   * @param {Array<Object>} preparedMedia - Prepared media items.
   * @param {Error} error - The error that caused the failure.
   * @param {string} model - Model used.
   */
  _trackFailedBatch(preparedMedia, error, model) {
    try {
      const { trackFailedBatch } = require("../../handlers/processingHandler");

      const errors = preparedMedia.map((item) => ({
        filename:
          item.originalMedia.originalname ||
          path.basename(item.originalMedia.path),
        error: error.message || "Unknown error",
      }));

      trackFailedBatch(errors);

      const { trackError } = require("../../utils/apiKeyTracker");
      const actualKeyUsed = this.metadataProcessor.apiKey;
      trackError(actualKeyUsed, model, error.message || "Unknown error");
    } catch (err) {
      console.warn(
        "[BatchProcessor] Failed to track failed batch:",
        err.message
      );
    }
  }

  /**
   * Cleans up temporary files asynchronously.
   *
   * @param {Array<string>} tempFiles - Paths to temporary files.
   */
  _cleanup(tempFiles) {
    if (tempFiles.length > 0) {
      cleanupTempFilesAsync(tempFiles);
    }
  }

  /**
   * Invokes the onBatchComplete callback if registered.
   */
  _notifyBatchComplete() {
    if (typeof this.options.onBatchComplete === "function") {
      this.options.onBatchComplete();
    }
  }

  /**
   * Creates cancelled result objects for all items in a batch.
   *
   * @param {Array<Object>} batch - Batch of media items.
   * @returns {Array<Object>} Cancelled results.
   */
  _createCancelledBatch(batch) {
    return batch.map((media) =>
      ProcessingStateManager.createCancelledResult(
        media.originalname || path.basename(media.path),
        media.path
      )
    );
  }

  /**
   * Creates failed result objects for all items in a batch.
   *
   * @param {Array<Object>} batch - Batch of media items.
   * @param {Error} error - The error that caused the failure.
   * @returns {Array<Object>} Failed results.
   */
  _createErrorBatch(batch, error) {
    return batch.map((media) => ({
      filename: media.originalname || path.basename(media.path),
      error: error.message || "Unknown error",
      status: "failed",
      originalPath: media.path,
      previewPath: media.path,
    }));
  }

  /**
   * Emits a single result to the global progress events for real-time UI updates.
   *
   * @param {Object} result - The result to emit.
   */
  _emitResultImmediately(result) {
    if (global.progressEvents?.onResultAvailable) {
      global.progressEvents.onResultAvailable(result);
    } else {
      console.warn("[BatchProcessor] No onResultAvailable callback registered");
    }
  }
}

module.exports = BatchProcessor;
