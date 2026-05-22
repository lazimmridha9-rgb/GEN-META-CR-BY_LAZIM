const fs = require("fs");
const path = require("path");

const { uploadToGemini } = require("../../ai/uploader");
const getGeminiConfig = require("../../ai/client");
const { getVideoInfo } = require("./utils");
const { maskApiKey } = require("../../../shared/helpers/mask-utils");
const {
  attemptVideoGeneration,
  buildRetryList,
  buildVideoPrompt,
} = require("./gemini-retry");
const { MAX_RETRIES } = require("../../../config/constants");

/**
 * Process a video file through the metadata generation pipeline
 * @param {string} filePath - Path to the video file
 * @param {object} options - Processing options
 * @param {string|string[]} apiKey - API key(s) for Gemini
 * @param {string[]|null} [allApiKeys=null] - All available keys for retry
 * @returns {Promise<object>} Processing result
 */
async function processVideo(filePath, options, apiKey, allApiKeys = null) {
  const availableApiKeys =
    allApiKeys || (Array.isArray(apiKey) ? apiKey : [apiKey]);
  let currentApiKey = Array.isArray(apiKey) ? apiKey[0] : apiKey;
  let currentModel = options.geminiModel;
  let { genAI, model, generationConfig } = getGeminiConfig(
    currentApiKey,
    currentModel,
  );

  try {
    if (!filePath || !fs.existsSync(filePath)) {
      throw new Error(
        "Video file path is invalid or file does not exist",
      );
    }

    const videoInfo = await getVideoInfo(filePath);
    let geminiFile = await uploadToGemini(
      filePath,
      videoInfo.mimeType,
      currentApiKey,
    );

    const forbiddenStr = require("../../ai/prompt").getForbiddenKeywordsString(
      options.negativeKeywords,
    );
    const videoPrompt = buildVideoPrompt(
      options,
      options.negativeKeywords,
    );

    // Initial retry attempts
    let metadata = null;
    let lastError = null;

    for (let retry = 0; retry < MAX_RETRIES; retry++) {
      try {
        metadata = await attemptVideoGeneration(
          genAI,
          model,
          generationConfig,
          geminiFile,
          videoPrompt,
          forbiddenStr,
        );
        break;
      } catch (error) {
        lastError = error;
        console.warn(
          `[processVideo] Attempt ${retry + 1} failed with ${maskApiKey(currentApiKey)} + ${currentModel}: ${error.message}`,
        );
        if (retry < MAX_RETRIES - 1) {
          await new Promise((r) =>
            setTimeout(
              r,
              1000 * Math.pow(2, retry + 1) + Math.random() * 1000,
            ),
          );
        }
      }
    }

    // Try alternative key-model combinations
    if (!metadata && availableApiKeys.length > 1) {
      const retryCombos = buildRetryList(
        currentApiKey,
        currentModel,
        availableApiKeys,
      );

      for (const combo of retryCombos) {
        currentApiKey = combo.apiKey;
        currentModel = combo.model;

        const config = getGeminiConfig(currentApiKey, currentModel);
        genAI = config.genAI;
        model = config.model;
        generationConfig = config.generationConfig;

        try {
          geminiFile = await uploadToGemini(
            filePath,
            videoInfo.mimeType,
            currentApiKey,
          );
          metadata = await attemptVideoGeneration(
            genAI,
            model,
            generationConfig,
            geminiFile,
            videoPrompt,
            forbiddenStr,
          );
          console.log(
            `[processVideo] ✓ Success with ${maskApiKey(combo.apiKey)} + ${combo.model}`,
          );
          break;
        } catch (error) {
          lastError = error;
          console.warn(
            `[processVideo] ⚠ Failed with ${maskApiKey(combo.apiKey)} + ${combo.model}: ${error.message}`,
          );
        }
      }
    }

    if (!metadata) {
      throw new Error(
        lastError?.message ||
          "Failed to get valid metadata for video after trying all combinations",
      );
    }

    return {
      filename: videoInfo.filename,
      metadata,
      status: "success",
      mediaType: "video",
      originalPath: filePath,
    };
  } catch (error) {
    console.error(`Error processing video ${filePath}:`, error);
    return {
      filename: path.basename(filePath),
      error: error.message || "Unknown error",
      status: "failed",
      mediaType: "video",
      originalPath: filePath,
    };
  }
}

module.exports = { processVideo };
