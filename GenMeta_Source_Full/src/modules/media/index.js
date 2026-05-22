const fs = require("fs");
const path = require("path");

const ProcessingStateManager = require("../processing/pipeline/state-manager");
const { getMediaFilename, getMediaType } = require("./format");
const { createJpgCopy, createPngCopy } = require("./image/copy-creator");
const { ensureTempDir, prepareImageItem, prepareVideoItem } = require("./preparer");
const { getMimeType } = require("./mime");

/**
 * Media processor class for preparing media files for metadata generation
 */
class MediaProcessor {
  /**
   * @param {string} ghostscriptPath - Path to Ghostscript executable
   */
  constructor(ghostscriptPath) {
    this.ghostscriptPath = ghostscriptPath;
    this.tempFiles = [];
  }

  /**
   * Prepare a batch of media files for processing
   * @param {object[]} batch - Array of media file objects
   * @returns {Promise<object[]>} Array of prepared media objects
   */
  async prepareMedia(batch) {
    ProcessingStateManager.checkAndThrowIfStopped("media preparation");

    const tempDir = await ensureTempDir("media-processing");
    const videoTempDir = await ensureTempDir("video-processing");

    const preparedMedia = await Promise.all(
      batch.map((media) => this._prepareMediaItem(media, tempDir, videoTempDir)),
    );

    ProcessingStateManager.checkAndThrowIfStopped("after media preparation");
    return preparedMedia;
  }

  /**
   * Prepare a single media item based on its type
   * @param {object} media - Media file object
   * @param {string} tempDir - Image temp directory
   * @param {string} videoTempDir - Video temp directory
   * @returns {Promise<object>} Prepared media object
   */
  async _prepareMediaItem(media, tempDir, videoTempDir) {
    ProcessingStateManager.checkAndThrowIfStopped();

    if (!media.path) {
      throw new Error("Media object missing path property");
    }

    const mimeType = getMimeType(media.path);
    const mediaType = getMediaType(media.path, mimeType);

    if (mediaType === "video") {
      const result = await prepareVideoItem(media);
      if (result.wasCompressed) {
        this.tempFiles.push(result.processPath);
      }
      return {
        originalMedia: { ...media, originalname: getMediaFilename(media) },
        processPath: result.processPath,
        originalPath: result.originalPath,
        mimeType: result.mimeType,
        mediaBuffer: result.buffer,
        mediaType: "video",
        shouldCompress: result.needsCompression,
        wasCompressed: result.wasCompressed,
      };
    }

    // Image processing
    const result = await prepareImageItem(
      media,
      tempDir,
      this.ghostscriptPath,
    );
    this.tempFiles.push(...result.tempFiles);
    return result;
  }

  /**
   * Get the list of temporary files created during processing
   * @returns {string[]} Array of temp file paths
   */
  getTempFiles() {
    return this.tempFiles;
  }

  /**
   * Create a JPG copy of an EPS/SVG file
   * @param {object} item - Prepared media item
   * @param {object} metadata - Metadata to embed
   * @param {string} outputDir - Output directory
   * @returns {Promise<string|null>} JPG copy path or null
   */
  async createJpgCopy(item, metadata, outputDir) {
    return createJpgCopy(item, metadata, outputDir, this.ghostscriptPath);
  }

  /**
   * Create a PNG copy of an EPS/SVG file
   * @param {object} item - Prepared media item
   * @param {object} metadata - Metadata to embed
   * @param {string} outputDir - Output directory
   * @returns {Promise<string|null>} PNG copy path or null
   */
  async createPngCopy(item, metadata, outputDir) {
    return createPngCopy(item, metadata, outputDir, this.ghostscriptPath);
  }
}

module.exports = MediaProcessor;
