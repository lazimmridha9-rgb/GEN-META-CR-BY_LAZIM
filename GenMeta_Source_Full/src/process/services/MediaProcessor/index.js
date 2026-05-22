const ProcessingStateManager = require("../ProcessingStateManager");
const { getMediaType, getMediaFilename } = require("./fileFormat");
const { createJpgCopy, createPngCopy } = require("./copyCreator");
const {
  ensureTempDir,
  prepareVideoItem,
  prepareImageItem,
} = require("./mediaPreparer");

/**
 * Handles media preparation: format detection, conversion (EPS/SVG),
 * compression, and temp file management.
 */
class MediaProcessor {
  /**
   * Creates a new MediaProcessor.
   *
   * @param {string} ghostscriptPath - Path to the Ghostscript executable.
   */
  constructor(ghostscriptPath) {
    this.ghostscriptPath = ghostscriptPath;
    this.tempFiles = [];
  }

  /**
   * Prepares a batch of media files for processing.
   *
   * @param {Array<Object>} batch - Array of media file objects.
   * @returns {Promise<Array<Object>>} Prepared media objects.
   */
  async prepareMedia(batch) {
    ProcessingStateManager.checkAndThrowIfStopped("media preparation");
    const tempDir = await ensureTempDir("media-processing");
    const videoTempDir = await ensureTempDir("video-processing");

    const preparedMedia = await Promise.all(
      batch.map((media) => this._prepareMediaItem(media, tempDir, videoTempDir))
    );
    ProcessingStateManager.checkAndThrowIfStopped("after media preparation");
    return preparedMedia;
  }

  /**
   * Prepares a single media item (image or video).
   *
   * @param {Object} media - Media file object.
   * @param {string} tempDir - Temp directory for image processing.
   * @param {string} videoTempDir - Temp directory for video processing.
   * @returns {Promise<Object>} Prepared media object.
   */
  async _prepareMediaItem(media, tempDir, videoTempDir) {
    ProcessingStateManager.checkAndThrowIfStopped();
    if (!media.path) {
      throw new Error("Media object missing path property");
    }

    const mimeType = require("../../utils/getMimeType").getMimeType(
      media.path
    );
    const mediaType = getMediaType(media.path, mimeType);

    if (mediaType === "video") {
      const result = await prepareVideoItem(media);
      if (result.wasCompressed) this.tempFiles.push(result.processPath);
      return {
        originalMedia: {
          ...media,
          originalname: getMediaFilename(media),
        },
        processPath: result.processPath,
        originalPath: result.originalPath,
        mimeType: result.mimeType,
        mediaBuffer: result.buffer,
        mediaType: "video",
        shouldCompress: result.needsCompression,
        wasCompressed: result.wasCompressed,
      };
    }

    // Handle image files
    const result = await prepareImageItem(
      media,
      tempDir,
      this.ghostscriptPath
    );
    this.tempFiles.push(...result.tempFiles);
    return result;
  }

  /**
   * Returns the list of temporary files created during processing.
   *
   * @returns {Array<string>} Array of temp file paths.
   */
  getTempFiles() {
    return this.tempFiles;
  }

  /**
   * Creates a JPG copy of an EPS/SVG file.
   *
   * @param {Object} item - Prepared media item.
   * @param {Object} metadata - Metadata to embed.
   * @param {string} outputDir - Output directory.
   * @returns {Promise<string|null>} Path to the JPG copy.
   */
  async createJpgCopy(item, metadata, outputDir) {
    return createJpgCopy(item, metadata, outputDir, this.ghostscriptPath);
  }

  /**
   * Creates a PNG copy of an EPS/SVG file.
   *
   * @param {Object} item - Prepared media item.
   * @param {Object} metadata - Metadata to embed.
   * @param {string} outputDir - Output directory.
   * @returns {Promise<string|null>} Path to the PNG copy.
   */
  async createPngCopy(item, metadata, outputDir) {
    return createPngCopy(item, metadata, outputDir, this.ghostscriptPath);
  }
}

module.exports = MediaProcessor;
