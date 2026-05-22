const fs = require("fs");
const path = require("path");
const os = require("os");

const { getMimeType } = require("../../utils/getMimeType");
const {
  convertEpsToPng,
  convertSvgToPng,
  createTempImages,
} = require("../../utils/imageUtils");
const {
  createTempCompressedVideo,
  shouldCompressVideo,
} = require("../../utils/videoCompression");
const ProcessingStateManager = require("../ProcessingStateManager");
const CONSTANTS = require("../../../config/constant");
const {
  getMediaType,
  isEpsFile,
  isSvgFile,
  isCompressibleImageFormat,
  getMediaFilename,
} = require("./fileFormat");

/**
 * Ensures a temporary processing directory exists.
 *
 * @param {string} name - Directory name suffix.
 * @returns {Promise<string>} The temp directory path.
 */
async function ensureTempDir(name) {
  const tempDir = path.join(os.tmpdir(), name);
  if (!fs.existsSync(tempDir)) {
    await fs.promises.mkdir(tempDir, { recursive: true });
  }
  return tempDir;
}

/**
 * Prepares a video file for processing, compressing if necessary.
 *
 * @param {Object} media - Media file object.
 * @returns {Promise<Object>} Prepared video item with process path and buffer.
 */
async function prepareVideoItem(media) {
  const mediaBuffer = await fs.promises.readFile(media.path);
  const needsCompression = await shouldCompressVideo(media.path);
  let processPath = media.path;
  let compressedBuffer = mediaBuffer;

  if (needsCompression) {
    try {
      const compressedPath = await createTempCompressedVideo(media.path);
      processPath = compressedPath;
      compressedBuffer = await fs.promises.readFile(compressedPath);
    } catch (error) {
      console.warn(
        `Video compression failed, using original: ${error.message}`
      );
    }
  }

  return {
    processPath,
    originalPath: media.path,
    mimeType: getMimeType(media.path),
    buffer: compressedBuffer,
    needsCompression,
    wasCompressed: needsCompression && processPath !== media.path,
  };
}

/**
 * Prepares an image file for processing, handling EPS/SVG conversion
 * and resizing as needed.
 *
 * @param {Object} media - Media file object.
 * @param {string} tempDir - Temp directory for processing.
 * @param {string} ghostscriptPath - Ghostscript executable path.
 * @returns {Promise<Object>} Prepared image item.
 */
async function prepareImageItem(media, tempDir, ghostscriptPath) {
  const mimeType = getMimeType(media.path);
  const isEps = isEpsFile(media.path, mimeType);
  const isSvg = isSvgFile(media.path, mimeType);
  let mediaBuffer = await fs.promises.readFile(media.path);
  let processPath = media.path;
  const tempFiles = [];

  // Convert EPS/SVG to PNG for AI processing
  if (isEps) {
    if (!ghostscriptPath) {
      throw new Error("Ghostscript not found. Cannot convert EPS file.");
    }
    processPath = await convertEpsToPng(
      media.path,
      ghostscriptPath,
      50,
      true,
      true
    );
    mediaBuffer = await fs.promises.readFile(processPath);
    tempFiles.push(processPath);
  } else if (isSvg) {
    processPath = await convertSvgToPng(media.path, 50, false, true);
    tempFiles.push(processPath);
    const uploadPng = await convertSvgToPng(media.path, 50, true, false);
    mediaBuffer = await fs.promises.readFile(uploadPng);
    tempFiles.push(uploadPng);
  }

  // Resize compressible images for faster AI processing
  const shouldCompress =
    !isEps && !isSvg && isCompressibleImageFormat(media.path);
  let resizedPath;
  let originalPath;

  if (shouldCompress) {
    const result = await createTempImages(
      mediaBuffer,
      getMediaFilename(media),
      tempDir,
      CONSTANTS.DEFAULT_RESIZE_OPTIONS,
      false,
      null,
      null
    );
    resizedPath = result.resizedPath;
    originalPath = result.originalPath;
  } else if (isEps) {
    const result = await createTempImages(
      mediaBuffer,
      getMediaFilename(media),
      tempDir,
      CONSTANTS.DEFAULT_RESIZE_OPTIONS,
      true,
      media.path,
      ghostscriptPath
    );
    resizedPath = result.resizedPath;
    originalPath = result.originalPath;
  } else if (isSvg) {
    const result = await createTempImages(
      mediaBuffer,
      getMediaFilename(media),
      tempDir,
      CONSTANTS.DEFAULT_RESIZE_OPTIONS,
      false,
      null,
      null
    );
    resizedPath = result.resizedPath;
    originalPath = result.originalPath;
  } else {
    resizedPath = processPath;
    originalPath = processPath;
  }

  if (shouldCompress || isEps || isSvg) {
    tempFiles.push(resizedPath, originalPath);
  }

  return {
    originalMedia: {
      ...media,
      originalname: getMediaFilename(media),
    },
    resizedPath,
    originalPath,
    processPath,
    mimeType: isEps || isSvg ? "image/png" : mimeType,
    mediaBuffer,
    isEps,
    isSvg,
    shouldCompress,
    mediaType: "image",
    tempFiles,
  };
}

module.exports = { ensureTempDir, prepareVideoItem, prepareImageItem };
