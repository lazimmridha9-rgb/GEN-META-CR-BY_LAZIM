const path = require("path");
const {
  convertEpsToPng,
  convertSvgToPng,
  preloadBackgroundImage,
  createTempImages,
} = require("../utils/imageUtils");

/**
 * Preloads the background image for EPS/SVG conversions, suppressing errors.
 */
async function preloadBackground() {
  try {
    await preloadBackgroundImage();
  } catch (error) {
    console.warn("Warning: Failed to preload background image:", error.message);
  }
}

/**
 * Converts an EPS file to PNG and reads the result into a buffer.
 *
 * @param {string} filePath - Path to the EPS file.
 * @param {string} ghostscriptPath - Ghostscript executable path.
 * @param {Array<string>} tempFiles - Array to track temporary files.
 * @returns {Promise<{processPath: string, buffer: Buffer, mimeType: string}>}
 */
async function convertIfEps(filePath, ghostscriptPath, tempFiles) {
  if (!ghostscriptPath) {
    throw new Error("Ghostscript not found. Cannot convert EPS file.");
  }

  const pngPath = await convertEpsToPng(filePath, ghostscriptPath, 50, true);
  const buffer = await require("fs").promises.readFile(pngPath);
  tempFiles.push(pngPath);

  return { processPath: pngPath, buffer, mimeType: "image/png" };
}

/**
 * Converts an SVG file to PNG (preview and upload versions) and reads
 * the upload version into a buffer.
 *
 * @param {string} filePath - Path to the SVG file.
 * @param {Array<string>} tempFiles - Array to track temporary files.
 * @returns {Promise<{processPath: string, buffer: Buffer, mimeType: string, uploadPath: string}>}
 */
async function convertIfSvg(filePath, tempFiles) {
  const previewPath = await convertSvgToPng(filePath, 50, false, true);
  tempFiles.push(previewPath);

  const uploadPath = await convertSvgToPng(filePath, 50, true, false);
  const buffer = await require("fs").promises.readFile(uploadPath);
  tempFiles.push(uploadPath);

  return {
    processPath: previewPath,
    buffer,
    mimeType: "image/png",
    uploadPath,
  };
}

/**
 * Resizes an image buffer and creates temp copies for processing.
 *
 * @param {Buffer} buffer - Image buffer.
 * @param {string} filename - Original filename.
 * @param {string} tempDir - Temp directory path.
 * @returns {Promise<{resizedPath: string, originalPath: string}>}
 */
async function prepareImage(buffer, filename, tempDir) {
  return createTempImages(buffer, filename, tempDir, {
    width: 1080,
    quality: 100,
    withoutEnlargement: true,
  });
}

module.exports = { preloadBackground, convertIfEps, convertIfSvg, prepareImage };
