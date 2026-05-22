const path = require("path");

const { Semaphore } = require("../batch/semaphore");
const { addMetadataToFile } = require("../../metadata/file-writer");
const { validateMetadata } = require("../../metadata/validator");
const CONSTANTS = require("../../../config/constants");
const ProcessingStateManager = require("./state-manager");

/**
 * Process and format results after metadata generation
 * Handles metadata application, copy creation, and result notification
 */
class ResultProcessor {
  /**
   * @param {object} mediaProcessor - MediaProcessor instance
   * @param {object} metadataProcessor - MetadataProcessor instance
   */
  constructor(mediaProcessor, metadataProcessor) {
    this.mediaProcessor = mediaProcessor;
    this.metadataProcessor = metadataProcessor;
    this.uploadSemaphore = new Semaphore(
      CONSTANTS.MAX_CONCURRENT_UPLOAD_REQUESTS,
    );
  }

  /**
   * Process all results for a batch of prepared media
   * @param {object[]} preparedMedia - Array of prepared media objects
   * @param {object[]} metadataArray - Array of generated metadata
   * @param {object} options - Processing options
   * @returns {Promise<object[]>} Formatted results
   */
  async processResults(preparedMedia, metadataArray, options) {
    const uploadPromises = preparedMedia.map((item, index) =>
      this._processSingleResult(item, index, metadataArray, options),
    );

    const uploadResults = await Promise.allSettled(uploadPromises);
    return this._formatResults(uploadResults, preparedMedia);
  }

  /**
   * Process a single media item's result
   * @param {object} item - Prepared media item
   * @param {number} index - Item index
   * @param {object[]} metadataArray - Generated metadata array
   * @param {object} options - Processing options
   * @returns {Promise<object>} Result object
   */
  async _processSingleResult(item, index, metadataArray, options) {
    if (ProcessingStateManager.isProcessingStopped()) {
      return ProcessingStateManager.createCancelledResult(
        this._getFilename(item),
        item.originalMedia.path,
      );
    }

    const release = await this.uploadSemaphore.acquire();

    try {
      if (ProcessingStateManager.isProcessingStopped()) {
        return ProcessingStateManager.createCancelledResult(
          this._getFilename(item),
          item.originalMedia.path,
        );
      }

      // Get valid metadata (regenerate if needed)
      let metadata = await this._getValidMetadata(
        item,
        index,
        metadataArray,
      );

      // Apply metadata to file
      const metadataResult = await this._applyMetadata(item, metadata);

      // Create format copies if requested
      const jpgCopyPath = await this._createJpgCopyIfNeeded(
        item,
        metadata,
        options,
      );
      const pngCopyPath = await this._createPngCopyIfNeeded(
        item,
        metadata,
        options,
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
   * Get valid metadata for an item, regenerating if needed
   * @param {object} item - Prepared media item
   * @param {number} index - Item index
   * @param {object[]} metadataArray - Generated metadata
   * @returns {Promise<object>} Valid metadata object
   */
  async _getValidMetadata(item, index, metadataArray) {
    let metadata = metadataArray[index];
    const filename = this._getFilename(item);

    if (!metadata || !validateMetadata(metadata, filename)) {
      return await this.metadataProcessor.processSingleMediaMetadata(
        item,
        index,
      );
    }

    return metadata;
  }

  /**
   * Apply metadata to the media file
   * @param {object} item - Prepared media item
   * @param {object} metadata - Metadata to apply
   * @returns {Promise<object>} Metadata write result
   */
  async _applyMetadata(item, metadata) {
    const sourcePath =
      item.mediaType === "video"
        ? item.originalMedia.path
        : item.isEps || item.isSvg
          ? item.originalMedia.path
          : item.originalPath;

    return await addMetadataToFile(
      sourcePath,
      metadata,
      item.originalMedia.outputPath,
    );
  }

  /**
   * Create a JPG copy if requested and applicable
   * @param {object} item - Prepared media item
   * @param {object} metadata - Metadata for the copy
   * @param {object} options - Processing options
   * @returns {Promise<string|null>} JPG copy path or null
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
      item.originalMedia.outputPath || item.originalMedia.path,
    );
    return await this.mediaProcessor.createJpgCopy(
      item,
      metadata,
      outputDir,
    );
  }

  /**
   * Create a PNG copy if requested and applicable
   * @param {object} item - Prepared media item
   * @param {object} metadata - Metadata for the copy
   * @param {object} options - Processing options
   * @returns {Promise<string|null>} PNG copy path or null
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
      item.originalMedia.outputPath || item.originalMedia.path,
    );
    return await this.mediaProcessor.createPngCopy(
      item,
      metadata,
      outputDir,
    );
  }

  /**
   * Format upload results into a consistent array
   * @param {object[]} uploadResults - Promise.allSettled results
   * @param {object[]} preparedMedia - Original prepared media
   * @returns {object[]} Formatted results
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
   * Get the display filename for a media item
   * @param {object} item - Prepared media item
   * @returns {string} Filename
   */
  _getFilename(item) {
    return (
      item.originalMedia.originalname ||
      path.basename(item.originalMedia.path)
    );
  }

  /**
   * Emit a result to the renderer for real-time UI updates
   * @param {object} result - Processing result
   */
  _notifyResultAvailable(result) {
    if (global.progressEvents?.onResultAvailable) {
      global.progressEvents.onResultAvailable(result);
    } else {
      console.warn(
        "[ResultProcessor] No onResultAvailable callback registered",
      );
    }
  }
}

module.exports = ResultProcessor;
