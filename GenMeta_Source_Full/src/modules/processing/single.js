const fs = require("fs");
const path = require("path");
const os = require("os");

const { uploadToGemini } = require("../ai/uploader");
const getGeminiConfig = require("../ai/client");
const { addMetadataToFile } = require("../metadata/file-writer");
const { cleanupTempFilesAsync } = require("../../process/cleanupTempFilesAsync");
const { getMimeType } = require("../media/mime");
const {
  convertIfEps,
  convertIfSvg,
  preloadBackground,
  prepareImage,
} = require("./preprocessor");
const { processGeminiRetry } = require("./gemini-retry");

/**
 * Process a single media file through the full metadata pipeline
 * @param {string} filePath - Path to the file
 * @param {object} options - Processing options
 * @param {string} apiKey - Gemini API key
 * @param {string} gsPath - Ghostscript executable path
 * @param {boolean} [shouldTrackUsage=true] - Whether to report usage
 * @returns {Promise<object>} Processing result
 */
async function processSingleFile(
  filePath,
  options,
  apiKey,
  gsPath,
  shouldTrackUsage = true,
) {
  const { genAI, model, generationConfig } = getGeminiConfig(
    apiKey,
    options.geminiModel,
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

    // Convert EPS to PNG if needed
    if (
      mimeType === "application/octet-stream" &&
      path.extname(filePath).toLowerCase() === ".eps"
    ) {
      isEps = true;
      const result = await convertIfEps(filePath, gsPath, tempFiles);
      processPath = result.processPath;
      imageBuffer = result.buffer;
    }
    // Convert SVG to PNG if needed
    else if (
      (mimeType === "image/svg+xml" || mimeType === "application/octet-stream") &&
      path.extname(filePath).toLowerCase() === ".svg"
    ) {
      isSvg = true;
      const result = await convertIfSvg(filePath, tempFiles);
      processPath = result.processPath;
      imageBuffer = result.buffer;
    }

    // Resize/prepare image for upload
    const imageFilename = path.basename(filePath);
    const { resizedPath, originalPath } = await prepareImage(
      imageBuffer,
      imageFilename,
      tempDir,
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

    // Upload to Gemini and generate metadata
    const geminiFile = await uploadToGemini(
      preparedImage.resizedPath,
      preparedImage.mimeType,
      apiKey,
    );
    const { metadata, aiRequestSuccessful } = await processGeminiRetry(
      genAI,
      model,
      generationConfig,
      geminiFile,
      filePath,
      options,
      apiKey,
    );

    // Track usage
    if (shouldTrackUsage) {
      const { trackFailedBatch, trackSuccessfulBatch } = require("../processing");
      if (metadata && aiRequestSuccessful) {
        trackSuccessfulBatch(1);
      } else {
        trackFailedBatch([
          { filename: imageFilename, error: "Failed to get valid metadata" },
        ]);
      }
    }

    // Write metadata to file
    const metadataResult = await addMetadataToFile(
      isEps || isSvg ? filePath : preparedImage.originalPath,
      metadata,
      filePath,
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
      const { trackFailedBatch } = require("../processing");
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
