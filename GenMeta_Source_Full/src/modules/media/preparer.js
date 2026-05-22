const path = require("path");

const { getMimeType } = require("./mime");
const {
  convertEpsToPng,
  convertSvgToPng,
  createTempImages,
} = require("./image");
const {
  createTempCompressedVideo,
  shouldCompressVideo,
} = require("./video/compressor");
const ProcessingStateManager = require("../processing/pipeline/state-manager");
const CONSTANTS = require("../../config/constants");
const {
  getMediaType,
  getMediaFilename,
  isEpsFile,
  isSvgFile,
  isCompressibleImageFormat,
} = require("./format");

/**
 * Ensure a temporary directory exists
 * @param {string} name - Directory name
 * @returns {Promise<string>} Directory path
 */
async function ensureTempDir(name) {
  const tempDir = path.join(os.tmpdir(), name);
  if (!fs.existsSync(tempDir)) {
    await fs.promises.mkdir(tempDir, { recursive: true });
  }
  return tempDir;
}

/**
 * Prepare a video item for processing (with optional compression)
 * @param {object} media - Media file object
 * @returns {Promise<object>} Prepared video item
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
        `Video compression failed, using original: ${error.message}`,
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
 * Prepare an image item for processing (with format conversion and resizing)
 * @param {object} media - Media file object
 * @param {string} tempDir - Temporary directory
 * @param {string} ghostscriptPath - Ghostscript executable path
 * @returns {Promise<object>} Prepared image item
 */
async function prepareImageItem(media, tempDir, ghostscriptPath) {
  const mimeType = getMimeType(media.path);
  const isEps = isEpsFile(media.path, mimeType);
  const isSvg = isSvgFile(media.path, mimeType);

  let mediaBuffer = await fs.promises.readFile(media.path);
  let processPath = media.path;
  const tempFiles = [];

  // Convert EPS/SVG to PNG
  if (isEps) {
    if (!ghostscriptPath) {
      throw new Error("Ghostscript not found. Cannot convert EPS file.");
    }
    processPath = await convertEpsToPng(
      media.path,
      ghostscriptPath,
      50,
      true,
      true,
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

  // Resize/compress image
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
      null,
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
      ghostscriptPath,
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
      null,
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
    originalMedia: { ...media, originalname: getMediaFilename(media) },
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

const fs = require("fs");
const os = require("os");

module.exports = { ensureTempDir, prepareImageItem, prepareVideoItem };
