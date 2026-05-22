const path = require("path");

const { preloadBackgroundImage } = require("../../media/image/background");
const { cleanupTempFilesAsync } = require("../../../process/cleanupTempFilesAsync");
const ProcessingStateManager = require("./state-manager");
const MediaProcessor = require("./media-processor");
const MetadataProcessor = require("./metadata-generator");
const ResultProcessor = require("./result-processor");

/**
 * Orchestrates the full batch processing pipeline:
 * media preparation → metadata generation → result processing
 */
class BatchProcessor {
  /**
   * @param {string} assignedApiKey - API key assigned to this batch
   * @param {object} options - Processing options
   * @param {string} gsPath - Ghostscript path
   * @param {string[]|null} [allApiKeys=null] - All available keys for retry
   */
  constructor(assignedApiKey, options, gsPath, allApiKeys = null) {
    this.assignedApiKey = assignedApiKey;
    this.allApiKeys = allApiKeys || [assignedApiKey];
    this.options = options;
    this.gsPath = gsPath;

    this.mediaProcessor = new MediaProcessor(gsPath);

    // Reorder keys so assigned key is first
    const reorderedKeys = this._reorderKeysWithAssignedFirst(
      this.allApiKeys,
      assignedApiKey,
    );

    this.metadataProcessor = new MetadataProcessor(reorderedKeys, options);

    this.resultProcessor = new ResultProcessor(
      this.mediaProcessor,
      this.metadataProcessor,
    );

    // Store class reference for recreation if needed
    this.MetadataProcessor = MetadataProcessor;
  }

  /**
   * Reorder keys array so the assigned key comes first
   * @param {string[]} keys - All available keys
   * @param {string} assignedKey - Key to prioritize
   * @returns {string[]} Reordered keys
   */
  _reorderKeysWithAssignedFirst(keys, assignedKey) {
    if (!keys.includes(assignedKey)) return keys;
    const otherKeys = keys.filter((k) => k !== assignedKey);
    return [assignedKey, ...otherKeys];
  }

  /**
   * Process a batch of media files
   * @param {object[]} batch - Array of media file objects
   * @param {string|null} [assignedModel=null] - Model assigned to this batch
   * @param {boolean} [skipTracking=false] - Whether to skip usage tracking
   * @returns {Promise<object[]>} Processing results
   */
  async processBatch(batch, assignedModel = null, skipTracking = false) {
    let tempFiles = [];
    const effectiveModel = assignedModel || this.options.geminiModel;

    try {
      await this._preloadBackground();

      if (ProcessingStateManager.isProcessingStopped()) {
        return this._createCancelledBatch(batch);
      }

      // Prepare media files (resize, convert, etc.)
      const preparedMedia = await this.mediaProcessor.prepareMedia(batch);
      tempFiles = this.mediaProcessor.getTempFiles();

      // Generate metadata
      let metadataArray;

      try {
        const processingOptions = assignedModel
          ? { ...this.options, geminiModel: assignedModel }
          : this.options;

        // Recreate metadata processor if model changed
        if (assignedModel && assignedModel !== this.options.geminiModel) {
          const reorderedKeys = this._reorderKeysWithAssignedFirst(
            this.allApiKeys,
            this.assignedApiKey,
          );
          this.metadataProcessor = new this.MetadataProcessor(
            reorderedKeys,
            processingOptions,
          );
        }

        metadataArray = await this.metadataProcessor.processMetadata(
          preparedMedia,
        );

        this._trackSuccessfulBatch(preparedMedia.length, effectiveModel);
      } catch (error) {
        this._trackFailedBatch(preparedMedia, error, effectiveModel);

        // Create and emit failed results immediately
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

      // Process results (apply metadata, create copies, etc.)
      const results = await this.resultProcessor.processResults(
        preparedMedia,
        metadataArray,
        this.options,
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
   * Preload background image for transparent image compositing
   */
  async _preloadBackground() {
    try {
      await preloadBackgroundImage();
    } catch (error) {
      console.warn(
        "Warning: Failed to preload background image. Processing will continue but may encounter issues:",
        error.message,
      );
    }
  }

  /**
   * Track a successful batch in both local and server trackers
   * @param {number} fileCount - Number of files processed
   * @param {string} model - Model used
   */
  _trackSuccessfulBatch(fileCount, model) {
    try {
      const { trackSuccessfulBatch } = require("../index");
      trackSuccessfulBatch(fileCount);

      const { trackSuccess } = require("../../tracking");
      const actualKeyUsed = this.metadataProcessor.apiKey;
      trackSuccess(actualKeyUsed, model);
    } catch (error) {
      console.warn(
        "[BatchProcessor] Failed to track successful batch:",
        error.message,
      );
    }
  }

  /**
   * Track a failed batch in both local and server trackers
   * @param {object[]} preparedMedia - Prepared media items
   * @param {Error} error - Error that caused failure
   * @param {string} model - Model used
   */
  _trackFailedBatch(preparedMedia, error, model) {
    try {
      const { trackFailedBatch } = require("../index");

      const errors = preparedMedia.map((item) => ({
        filename:
          item.originalMedia.originalname ||
          path.basename(item.originalMedia.path),
        error: error.message || "Unknown error",
      }));

      trackFailedBatch(errors);

      const { trackError } = require("../../tracking");
      const actualKeyUsed = this.metadataProcessor.apiKey;
      trackError(actualKeyUsed, model, error.message || "Unknown error");
    } catch (err) {
      console.warn(
        "[BatchProcessor] Failed to track failed batch:",
        err.message,
      );
    }
  }

  /**
   * Clean up temporary files asynchronously
   * @param {string[]} tempFiles - Temp file paths to clean up
   */
  _cleanup(tempFiles) {
    if (tempFiles.length > 0) {
      cleanupTempFilesAsync(tempFiles);
    }
  }

  /**
   * Notify that the batch is complete via callback
   */
  _notifyBatchComplete() {
    if (typeof this.options.onBatchComplete === "function") {
      this.options.onBatchComplete();
    }
  }

  /**
   * Create cancelled results for a batch
   * @param {object[]} batch - Media items
   * @returns {object[]} Cancelled results
   */
  _createCancelledBatch(batch) {
    return batch.map((media) =>
      ProcessingStateManager.createCancelledResult(
        media.originalname || path.basename(media.path),
        media.path,
      ),
    );
  }

  /**
   * Create error results for a batch
   * @param {object[]} batch - Media items
   * @param {Error} error - Error that occurred
   * @returns {object[]} Error results
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
   * Emit a result immediately for real-time UI updates
   * @param {object} result - Processing result
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
