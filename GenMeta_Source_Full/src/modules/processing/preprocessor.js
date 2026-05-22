const path = require("path");

const { convertEpsToPng, convertSvgToPng, createTempImages, preloadBackgroundImage } = require("../media/image");

/**
 * Preload background image for transparent image compositing
 */
async function preloadBackground() {
  try {
    await preloadBackgroundImage();
  } catch (error) {
    console.warn("Warning: Failed to preload background image:", error.message);
  }
}

/**
 * Convert an EPS file to PNG using Ghostscript
 * @param {string} filePath - Path to EPS file
 * @param {string} ghostscriptPath - Path to Ghostscript executable
 * @param {string[]} tempFiles - Array to track temp files for cleanup
 * @returns {{ processPath: string, buffer: Buffer, mimeType: string }}
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
 * Convert an SVG file to PNG
 * @param {string} filePath - Path to SVG file
 * @param {string[]} tempFiles - Array to track temp files for cleanup
 * @returns {{ processPath: string, buffer: Buffer, mimeType: string, uploadPath: string }}
 */
async function convertIfSvg(filePath, tempFiles) {
  const previewPath = await convertSvgToPng(filePath, 50, false, true);
  tempFiles.push(previewPath);

  const uploadPath = await convertSvgToPng(filePath, 50, true, false);
  const buffer = await require("fs").promises.readFile(uploadPath);
  tempFiles.push(uploadPath);

  return { processPath: previewPath, buffer, mimeType: "image/png", uploadPath };
}

/**
 * Resize/prepare an image buffer for upload
 * @param {Buffer} buffer - Image buffer
 * @param {string} filename - Original filename
 * @param {string} tempDir - Temporary directory
 * @returns {{ resizedPath: string, originalPath: string }}
 */
async function prepareImage(buffer, filename, tempDir) {
  return await createTempImages(buffer, filename, tempDir, {
    width: 1080,
    quality: 100,
    withoutEnlargement: true,
  });
}

module.exports = { convertIfEps, convertIfSvg, preloadBackground, prepareImage };
