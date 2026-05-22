const path = require("path");
const { Semaphore } = require("../semaphore");
const { addMetadataToFile } = require("../addMetadataToFile");
const { validateMetadata } = require("../validateMetadata");
const ProcessingStateManager = require("./ProcessingStateManager");
const CONSTANTS = require("../../config/constant");

/**
 * Processes individual media results: applies metadata, creates format copies,
 * and emits results for real-time UI updates.
 */
class ResultProcessor {
  /**
   * Creates a new ResultProcessor.
   *
   * @param {MediaProcessor} mediaProcessor - Media processor instance.
   * @param {MetadataProcessor} metadataProcessor - Metadata processor instance.
   */
  constructor(mediaProcessor, metadataProcessor) {
    this.mediaProcessor = mediaProcessor;
    this.metadataProcessor = metadataProcessor;
    this.uploadSemaphore = new Semaphore(
      CONSTANTS.MAX_CONCURRENT_UPLOAD_REQUESTS
    );
  }

  /**
   * Processes results for all prepared media items in parallel.
   *
   * @param {Array<Object>} preparedMedia - Prepared media objects.
   * @param {Array<Object>} metadataArray - Generated metadata objects.
   * @param {Object} options - Processing options.
   * @returns {Promise<Array<Object>>} Array of result objects.
   */
  async processResults(preparedMedia, metadataArray, options) {
    const uploadPromises = preparedMedia.map((item, index) =>
      this._processSingleResult(item, index, metadataArray, options)
    );

    const uploadResults = await Promise.allSettled(uploadPromises);
    return this._formatResults(uploadResults, preparedMedia);
  }

  /**
   * Processes a single media item result.
   *
   * @param {Object} item - Prepared media item.
   * @param {number} index - Index in the batch.
   * @param {Array<Object>} metadataArray - Generated metadata.
   * @param {Object} options - Processing options.
   * @returns {Promise<Object>} Result object.
   */
  async _processSingleResult(item, index, metadataArray, options) {
    if (ProcessingStateManager.isProcessingStopped()) {
      return ProcessingStateManager.createCancelledResult(
        this._getFilename(item),
        item.originalMedia.path
      );
    }

    const release = await this.uploadSemaphore.acquire();

    try {
      if (ProcessingStateManager.isProcessingStopped()) {
        return ProcessingStateManager.createCancelledResult(
          this._getFilename(item),
          item.originalMedia.path
        );
      }

      // Get valid metadata (regenerate if needed)
      let metadata = await this._getValidMetadata(
        item,
        index,
        metadataArray
      );

      // Apply metadata to the file
      const metadataResult = await this._applyMetadata(item, metadata);

      // Create format copies if requested
      const jpgCopyPath = await this._createJpgCopyIfNeeded(
        item,
        metadata,
        options
      );
      const pngCopyPath = await this._createPngCopyIfNeeded(
        item,
        metadata,
        options
      );

      // Build unified result structure
      const result = {
        filename: this._getFilename(item),
        size: item.originalMedia.size,
        metadata,
        outputPath: metadataResult.outputPath,
        originalPath: item.originalMedia.path,
        mediaType: item.mediaType,
        status: "success",
      };

      // Add media-specific properties
      if (item.mediaType === "video") {
        result.isVideo = true;
        result.previewPath = item.originalMedia.path;
      } else {
        result.originalFormat = item.isEps
          ? "eps"
          : item.isSvg
            ? "svg"
            : undefined;
        result.previewPath =
          item.isEps || item.isSvg
            ? item.processPath
            : metadataResult.outputPath || item.originalMedia.path;
        result.jpgCopyPath = jpgCopyPath;
        result.pngCopyPath = pngCopyPath;
      }

      // Emit for real-time UI updates
      this._notifyResultAvailable(result);

      return result;
    } catch (error) {
      const failedResult = {
        filename: this._getFilename(item),
        error: error.message || "Unknown error",
        status: "failed",
        originalPath: item.originalMedia.path,
        previewPath: item.originalMedia.path,
        mediaType: item.mediaType,
        isVideo: item.mediaType === "video",
      };

      this._notifyResultAvailable(failedResult);

      return failedResult;
    } finally {
      release();
    }
  }

  /**
   * Retrieves validated metadata, regenerating it if the existing entry is invalid.
   *
   * @param {Object} item - Prepared media item.
   * @param {number} index - Index in the batch.
   * @param {Array<Object>} metadataArray - Existing metadata array.
   * @returns {Promise<Object>} Valid metadata object.
   */
  async _getValidMetadata(item, index, metadataArray) {
    let metadata = metadataArray[index];
    const filename = this._getFilename(item);

    if (!metadata || !validateMetadata(metadata, filename)) {
      return this.metadataProcessor.processSingleMediaMetadata(item, index);
    }

    return metadata;
  }

  /**
   * Applies metadata to the media file.
   *
   * @param {Object} item - Prepared media item.
   * @param {Object} metadata - Metadata to apply.
   * @returns {Promise<Object>} Result from addMetadataToFile.
   */
  async _applyMetadata(item, metadata) {
    const sourcePath =
      item.mediaType === "video"
        ? item.originalMedia.path
        : item.isEps || item.isSvg
          ? item.originalMedia.path
          : item.originalPath;

    return addMetadataToFile(
      sourcePath,
      metadata,
      item.originalMedia.outputPath
    );
  }

  /**
   * Creates a JPG copy for EPS/SVG files if requested.
   *
   * @param {Object} item - Prepared media item.
   * @param {Object} metadata - Metadata for the copy.
   * @param {Object} options - Processing options.
   * @returns {Promise<string|null>} Path to the JPG copy, or null.
   */
  async _createJpgCopyIfNeeded(item, metadata, options) {
    if (
      !options.createJpgCopy ||
      (!item.isEps && !item.isSvg) ||
      item.mediaType === "video"
    ) {
      return null;
    }

    const outputDir = path.dirname(
      item.originalMedia.outputPath || item.originalMedia.path
    );
    return this.mediaProcessor.createJpgCopy(item, metadata, outputDir);
  }

  /**
   * Creates a PNG copy for EPS/SVG files if requested.
   *
   * @param {Object} item - Prepared media item.
   * @param {Object} metadata - Metadata for the copy.
   * @param {Object} options - Processing options.
   * @returns {Promise<string|null>} Path to the PNG copy, or null.
   */
  async _createPngCopyIfNeeded(item, metadata, options) {
    if (
      !options.createPngCopy ||
      (!item.isEps && !item.isSvg) ||
      item.mediaType === "video"
    ) {
      return null;
    }

    const outputDir = path.dirname(
      item.originalMedia.outputPath || item.originalMedia.path
    );
    return this.mediaProcessor.createPngCopy(item, metadata, outputDir);
  }

  /**
   * Formats upload results into a consistent result array.
   *
   * @param {Array<Object>} uploadResults - Results from Promise.allSettled.
   * @param {Array<Object>} preparedMedia - Original prepared media items.
   * @returns {Array<Object>} Formatted results.
   */
  _formatResults(uploadResults, preparedMedia) {
    const results = [];

    uploadResults.forEach((result, index) => {
      if (result.status === "fulfilled") {
        results.push(result.value);
      } else {
        results.push({
          filename: this._getFilename(preparedMedia[index]),
          error: result.reason?.message || "Unknown error",
          status: "failed",
          originalPath: preparedMedia[index].originalMedia.path,
          mediaType: preparedMedia[index].mediaType,
        });
      }
    });

    return results;
  }

  /**
   * Extracts the filename from a media item.
   *
   * @param {Object} item - Media item.
   * @returns {string} The filename.
   */
  _getFilename(item) {
    return (
      item.originalMedia.originalname || path.basename(item.originalMedia.path)
    );
  }

  /**
   * Emits a result to the global progress events for real-time UI updates.
   *
   * @param {Object} result - The result to emit.
   */
  _notifyResultAvailable(result) {
    if (global.progressEvents?.onResultAvailable) {
      global.progressEvents.onResultAvailable(result);
    } else {
      console.warn(
        "[ResultProcessor] No onResultAvailable callback registered"
      );
    }
  }
}

module.exports = ResultProcessor;
