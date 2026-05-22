const fs = require("fs");
const path = require("path");
const {
  convertEpsToPng,
  convertEpsToJpg,
  convertSvgToPng,
} = require("../../utils/imageUtils");

/**
 * Copies a file from source to destination, then removes the source.
 *
 * @param {string} src - Source file path.
 * @param {string} dest - Destination file path.
 */
async function copyFile(src, dest) {
  await fs.promises.copyFile(src, dest);
  try {
    await fs.promises.unlink(src);
  } catch (e) {
    console.warn(`Warning: Failed to clean up temp file: ${e.message}`);
  }
}

/**
 * Creates a JPG copy of an EPS or SVG file with embedded metadata.
 *
 * @param {Object} item - Prepared media item.
 * @param {Object} metadata - Metadata to embed.
 * @param {string} outputDir - Output directory.
 * @param {string} ghostscriptPath - Ghostscript executable path.
 * @returns {Promise<string|null>} Path to the JPG copy, or null on failure.
 */
async function createJpgCopy(item, metadata, outputDir, ghostscriptPath) {
  if (
    ((!item.isEps && !item.isSvg) && item.mediaType !== "image") ||
    (!item.isEps && !ghostscriptPath)
  ) {
    return null;
  }

  try {
    const ext = item.isEps ? ".eps" : ".svg";
    const baseName = path.basename(item.originalMedia.path, ext);
    const jpgOutputPath = path.join(outputDir, `${baseName}.jpg`);

    if (!fs.existsSync(outputDir)) {
      await fs.promises.mkdir(outputDir, { recursive: true });
    }

    let jpgPath;
    if (item.isEps) {
      // Convert EPS directly to JPG
      jpgPath = await convertEpsToJpg(
        item.originalMedia.path,
        ghostscriptPath,
        jpgOutputPath
      );
    } else if (item.isSvg) {
      // Convert SVG to PNG, then flatten and convert to JPG
      const pngPath = await convertSvgToPng(
        item.originalMedia.path,
        100,
        false,
        false
      );
      await require("sharp")(pngPath)
        .flatten({ background: { r: 255, g: 255, b: 255 } })
        .jpeg({ quality: 100 })
        .toFile(jpgOutputPath);
      try {
        await fs.promises.unlink(pngPath);
      } catch (e) {
        console.warn(`Warning: Failed to clean up temp PNG: ${e.message}`);
      }
      jpgPath = jpgOutputPath;
    }

    // Embed metadata into the JPG copy
    const { addMetadataToFile } = require("../../addMetadataToFile");
    const jpgMetadataResult = await addMetadataToFile(jpgPath, metadata);
    return jpgMetadataResult.status ? jpgMetadataResult.outputPath : jpgPath;
  } catch (jpgError) {
    console.error(`Error creating JPG copy: ${jpgError.message}`);
    return null;
  }
}

/**
 * Creates a PNG copy of an EPS or SVG file with embedded metadata.
 *
 * @param {Object} item - Prepared media item.
 * @param {Object} metadata - Metadata to embed.
 * @param {string} outputDir - Output directory.
 * @param {string} ghostscriptPath - Ghostscript executable path.
 * @returns {Promise<string|null>} Path to the PNG copy, or null on failure.
 */
async function createPngCopy(item, metadata, outputDir, ghostscriptPath) {
  if (
    ((!item.isEps && !item.isSvg) && item.mediaType !== "image") ||
    (!item.isEps && !ghostscriptPath)
  ) {
    return null;
  }

  try {
    const ext = item.isEps ? ".eps" : ".svg";
    const baseName = path.basename(item.originalMedia.path, ext);
    const pngOutputPath = path.join(outputDir, `${baseName}.png`);

    if (!fs.existsSync(outputDir)) {
      await fs.promises.mkdir(outputDir, { recursive: true });
    }

    let pngPath;
    if (item.isEps) {
      const tempPng = await convertEpsToPng(
        item.originalMedia.path,
        ghostscriptPath,
        100,
        false,
        false
      );
      await copyFile(tempPng, pngOutputPath);
      pngPath = pngOutputPath;
    } else if (item.isSvg) {
      const tempPng = await convertSvgToPng(
        item.originalMedia.path,
        100,
        false,
        false
      );
      await copyFile(tempPng, pngOutputPath);
      pngPath = pngOutputPath;
    }

    // Embed metadata into the PNG copy
    const { addMetadataToFile } = require("../../addMetadataToFile");
    const pngMetadataResult = await addMetadataToFile(pngPath, metadata);
    return pngMetadataResult.status ? pngMetadataResult.outputPath : pngPath;
  } catch (pngError) {
    console.error(`Error creating PNG copy: ${pngError.message}`);
    return null;
  }
}

module.exports = { createJpgCopy, createPngCopy };
