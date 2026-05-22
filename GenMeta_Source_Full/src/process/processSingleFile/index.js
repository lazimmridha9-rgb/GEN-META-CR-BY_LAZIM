const fs = require("fs");
const path = require("path");
const os = require("os");

const { uploadToGemini } = require("../uploadGemini");
const getGeminiConfig = require("../ai/config");
const { addMetadataToFile } = require("../addMetadataToFile");
const { cleanupTempFilesAsync } = require("../cleanupTempFilesAsync");
const { getMimeType } = require("../utils/getMimeType");
const {
  preloadBackground,
  convertIfEps,
  convertIfSvg,
  prepareImage,
} = require("./filePreprocessor");
const { processGeminiRetry } = require("./geminiRetry");

/**
 * Processes a single media file (image or vector) through the full pipeline:
 * format conversion, resizing, Gemini metadata generation, and metadata embedding.
 *
 * @param {string} filePath - Path to the media file.
 * @param {Object} options - Processing options.
 * @param {string} apiKey - Gemini API key.
 * @param {string} gsPath - Ghostscript executable path (for EPS).
 * @param {boolean} [shouldTrackUsage=true] - Whether to track usage statistics.
 * @returns {Promise<Object>} Result with filename, metadata, outputPath, and status.
 */
async function processSingleFile(
  filePath,
  options,
  apiKey,
  gsPath,
  shouldTrackUsage = true
) {
  const { genAI, model, generationConfig } = getGeminiConfig(
    apiKey,
    options.geminiModel
  );
  const tempFiles = [];

  await preloadBackground();

  try {
    if (!filePath || !fs.existsSync(filePath)) {
      throw new Error("File path is invalid or file does not exist");
    }

    const tempDir = path.join(os.tmpdir(), "image-processing");
    if (!fs.existsSync(tempDir)) {
      await fs.promises.mkdir(tempDir, { recursive: true });
    }

    const mimeType = getMimeType(filePath);
    let imageBuffer = await fs.promises.readFile(filePath);
    let processPath = filePath;
    let isEps = false;
    let isSvg = false;

    // Convert EPS files to PNG for AI processing
    if (
      mimeType === "application/octet-stream" &&
      path.extname(filePath).toLowerCase() === ".eps"
    ) {
      isEps = true;
      const result = await convertIfEps(filePath, gsPath, tempFiles);
      processPath = result.processPath;
      imageBuffer = result.buffer;
    }
    // Convert SVG files to PNG for AI processing
    else if (
      (mimeType === "image/svg+xml" || mimeType === "application/octet-stream") &&
      path.extname(filePath).toLowerCase() === ".svg"
    ) {
      isSvg = true;
      const result = await convertIfSvg(filePath, tempFiles);
      processPath = result.processPath;
      imageBuffer = result.buffer;
    }

    // Resize the image for faster AI processing
    const imageFilename = path.basename(filePath);
    const { resizedPath, originalPath } = await prepareImage(
      imageBuffer,
      imageFilename,
      tempDir
    );
    tempFiles.push(resizedPath, originalPath);

    const preparedImage = {
      originalname: imageFilename,
      path: filePath,
      resizedPath,
      originalPath,
      processPath,
      mimeType: isEps || isSvg ? "image/png" : mimeType,
      imageBuffer,
      isEps,
      isSvg,
    };

    // Upload to Gemini and generate metadata with retry
    const geminiFile = await uploadToGemini(
      preparedImage.resizedPath,
      preparedImage.mimeType,
      apiKey
    );
    const { metadata, aiRequestSuccessful } = await processGeminiRetry(
      genAI,
      model,
      generationConfig,
      geminiFile,
      filePath,
      options,
      apiKey
    );

    // Track usage statistics
    if (shouldTrackUsage) {
      const {
        trackFailedBatch,
        trackSuccessfulBatch,
      } = require("../../handlers/processingHandler");
      if (metadata && aiRequestSuccessful) {
        trackSuccessfulBatch(1);
      } else {
        trackFailedBatch([
          { filename: imageFilename, error: "Failed to get valid metadata" },
        ]);
      }
    }

    // Embed metadata into the file
    const metadataResult = await addMetadataToFile(
      isEps || isSvg ? filePath : preparedImage.originalPath,
      metadata,
      filePath
    );
    cleanupTempFilesAsync(tempFiles);

    return {
      filename: imageFilename,
      metadata,
      outputPath: metadataResult.outputPath,
      originalFormat: isEps ? "eps" : isSvg ? "svg" : undefined,
      previewPath: isEps || isSvg ? processPath : undefined,
      status: "success",
    };
  } catch (error) {
    if (shouldTrackUsage) {
      const { trackFailedBatch } = require("../../handlers/processingHandler");
      trackFailedBatch([
        {
          filename: path.basename(filePath),
          error: error.message || "Unknown error",
        },
      ]);
    }
    cleanupTempFilesAsync(tempFiles);

    return {
      filename: path.basename(filePath),
      error: error.message || "Unknown error",
      status: "failed",
      originalPath: filePath,
    };
  }
}

module.exports = { processSingleFile };
