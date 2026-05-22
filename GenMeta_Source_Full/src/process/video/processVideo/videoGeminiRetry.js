const {
  generatePrompt,
  getForbiddenKeywordsString,
  ensureMetadataArray,
} = require("../../ai/prompt");
const { getKeyStats, SUPPORTED_MODELS } = require("../../../utils/apiKeyTracker");
const getGeminiConfig = require("../../ai/config");
const { validateMetadata } = require("../../validateMetadata");
const { executeGeminiApiCall } = require("../../ai/errorHandler");
const {
  extractJsonStructure,
  extractTextFromResponse,
} = require("../../../shared/helpers/jsonHelpers");
const { MAX_RETRIES, INITIAL_TIMEOUT } = require("../../../config/constant");

/**
 * Builds a sorted list of alternative API key / model combinations for video retry.
 *
 * @param {string} currentKey - Currently active API key.
 * @param {string} currentModel - Currently active model.
 * @param {Array<string>} availableApiKeys - All available API keys.
 * @returns {Array<Object>} Sorted retry combinations.
 */
function buildRetryList(currentKey, currentModel, availableApiKeys) {
  const retryCombos = [];

  for (const key of availableApiKeys) {
    for (const mdl of SUPPORTED_MODELS) {
      if (key === currentKey && mdl === currentModel) continue;
      const stats = getKeyStats(key, mdl);
      retryCombos.push({
        apiKey: key,
        model: mdl,
        errorCount: stats.errorCount,
        successCount: stats.successCount,
      });
    }
  }

  // Sort: no errors first, then fewer errors, then more successes
  retryCombos.sort((a, b) => {
    const aErr = a.errorCount > 0;
    const bErr = b.errorCount > 0;

    if (!aErr && bErr) return -1;
    if (aErr && !bErr) return 1;
    if (!aErr && !bErr) return a.successCount - b.successCount;
    if (a.errorCount !== b.errorCount) return a.errorCount - b.errorCount;
    return a.successCount - b.successCount;
  });

  return retryCombos;
}

/**
 * Attempts to generate video metadata via the Gemini API with a timeout.
 * Parses and validates the response.
 *
 * @param {Object} genAI - Gemini client instance.
 * @param {string} model - Model name.
 * @param {Object} generationConfig - Generation configuration.
 * @param {Object} geminiFile - Uploaded Gemini file reference.
 * @param {string} videoPrompt - Prompt for video analysis.
 * @param {string} forbiddenStr - Forbidden keywords string.
 * @returns {Promise<Object>} Validated metadata object.
 * @throws {Error} If the response is invalid or the API call fails.
 */
async function attemptVideoGeneration(
  genAI,
  model,
  generationConfig,
  geminiFile,
  videoPrompt,
  forbiddenStr
) {
  const result = await executeGeminiApiCall(async () => {
    return Promise.race([
      genAI.models.generateContent({
        model,
        config: generationConfig,
        contents: [
          {
            role: "user",
            parts: [geminiFile, { text: `${videoPrompt}: ${forbiddenStr}` }],
          },
        ],
      }),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`Gemini API timeout after ${INITIAL_TIMEOUT}ms`)),
          INITIAL_TIMEOUT
        )
      ),
    ]);
  });

  const jsonResponse = extractTextFromResponse(result);
  const parsed = extractJsonStructure(jsonResponse);
  const arr = ensureMetadataArray(parsed);

  if (arr.length === 0) {
    throw new Error("No valid metadata found in response");
  }
  if (!validateMetadata(arr[0], "")) {
    throw new Error("Invalid metadata format");
  }

  return arr[0];
}

/**
 * Builds the complete prompt for video metadata generation.
 *
 * @param {Object} options - Processing options.
 * @param {string} negativeKeywords - Keywords to exclude.
 * @returns {string} The video-specific prompt string.
 */
function buildVideoPrompt(options, negativeKeywords) {
  const promptStr = generatePrompt(
    "mp4",
    options.titleLength || 90,
    options.titleLengthMode || "fixed",
    options.descriptionLength || 120,
    options.keywordCount || 25,
    options.positiveKeywords,
    negativeKeywords,
    options.keywordFormat || "auto",
    options.customPrompt,
    options.enableCustomPrompt || false,
    options.additionalPromptText,
    options.enableAdobeStockCategories || false,
    options.enableShutterstockCategories !== undefined
      ? options.enableShutterstockCategories
      : true
  );

  return `${promptStr}\n\nFor this video file: Focus on motion, action, cinematography, and temporal elements. Include video-specific relevant keywords like 'motion', 'dynamic', 'cinematic', 'footage', 'clip', etc.`;
}

module.exports = { buildRetryList, attemptVideoGeneration, buildVideoPrompt };
