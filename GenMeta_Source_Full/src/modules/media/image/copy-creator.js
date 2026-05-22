const fs = require("fs");
const path = require("path");

const { convertEpsToPng, convertSvgToPng } = require(".");

/**
 * Copy a file and remove the source
 * @param {string} src - Source path
 * @param {string} dest - Destination path
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
 * Create a JPG copy from an EPS or SVG file
 * @param {object} item - Prepared media item
 * @param {object} metadata - Metadata to embed
 * @param {string} outputDir - Output directory
 * @param {string} ghostscriptPath - Ghostscript path
 * @returns {Promise<string|null>} JPG path or null
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
      jpgPath = await convertEpsToJpg(
        item.originalMedia.path,
        ghostscriptPath,
        jpgOutputPath,
      );
    } else if (item.isSvg) {
      const pngPath = await convertSvgToPng(
        item.originalMedia.path,
        100,
        false,
        false,
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

    const { addMetadataToFile } = require("../../metadata/file-writer");
    const jpgMetadataResult = await addMetadataToFile(jpgPath, metadata);
    return jpgMetadataResult.status ? jpgMetadataResult.outputPath : jpgPath;
  } catch (jpgError) {
    console.error(`Error creating JPG copy: ${jpgError.message}`);
    return null;
  }
}

/**
 * Create a PNG copy from an EPS or SVG file
 * @param {object} item - Prepared media item
 * @param {object} metadata - Metadata to embed
 * @param {string} outputDir - Output directory
 * @param {string} ghostscriptPath - Ghostscript path
 * @returns {Promise<string|null>} PNG path or null
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
        false,
      );
      await copyFile(tempPng, pngOutputPath);
      pngPath = pngOutputPath;
    } else if (item.isSvg) {
      const tempPng = await convertSvgToPng(
        item.originalMedia.path,
        100,
        false,
        false,
      );
      await copyFile(tempPng, pngOutputPath);
      pngPath = pngOutputPath;
    }

    const { addMetadataToFile } = require("../../metadata/file-writer");
    const pngMetadataResult = await addMetadataToFile(pngPath, metadata);
    return pngMetadataResult.status ? pngMetadataResult.outputPath : pngPath;
  } catch (pngError) {
    console.error(`Error creating PNG copy: ${pngError.message}`);
    return null;
  }
}

const { convertEpsToJpg } = require("./eps-converter");

module.exports = { createJpgCopy, createPngCopy };
