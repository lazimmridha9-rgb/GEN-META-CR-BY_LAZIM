const { SUPPORTED_MODELS } = require("../../tracking");

const { generatePrompt, ensureMetadataArray, getForbiddenKeywordsString } = require("../../ai/prompt");
const getGeminiConfig = require("../../ai/client");
const { executeGeminiApiCall } = require("../../ai/error-handler");
const { extractJsonStructure, extractTextFromResponse } = require("../../../shared/helpers/json-helpers");
const { validateMetadata } = require("../../metadata/validator");
const { INITIAL_TIMEOUT, MAX_RETRIES } = require("../../../config/constants");

/**
 * Build a sorted list of alternative key-model combinations for retry
 * @param {string} currentKey - Current API key
 * @param {string} currentModel - Current model
 * @param {string[]} availableApiKeys - All available API keys
 * @returns {object[]} Sorted retry combinations
 */
function buildRetryList(currentKey, currentModel, availableApiKeys) {
  const retryCombos = [];

  for (const key of availableApiKeys) {
    for (const mdl of SUPPORTED_MODELS) {
      if (key === currentKey && mdl === currentModel) continue;

      const { getKeyStats } = require("../../tracking");
      const stats = getKeyStats(key, mdl);
      retryCombos.push({
        apiKey: key,
        model: mdl,
        errorCount: stats.errorCount,
        successCount: stats.successCount,
      });
    }
  }

  // Sort: error-free first (by success count), then error combos (by error count)
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
 * Attempt video metadata generation with a single API call
 * @param {object} genAI - Gemini AI client
 * @param {string} model - Model identifier
 * @param {object} generationConfig - Generation config
 * @param {object} geminiFile - Uploaded file reference
 * @param {string} videoPrompt - Prompt string
 * @param {string} forbiddenStr - Forbidden keywords string
 * @returns {Promise<object>} Metadata object
 */
async function attemptVideoGeneration(
  genAI,
  model,
  generationConfig,
  geminiFile,
  videoPrompt,
  forbiddenStr,
) {
  const result = await executeGeminiApiCall(async () => {
    return await Promise.race([
      genAI.models.generateContent({
        model,
        config: generationConfig,
        contents: [
          {
            role: "user",
            parts: [
              geminiFile,
              { text: `${videoPrompt}: ${forbiddenStr}` },
            ],
          },
        ],
      }),
      new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                `Gemini API timeout after ${INITIAL_TIMEOUT}ms`,
              ),
            ),
          INITIAL_TIMEOUT,
        ),
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
 * Build a video-specific prompt string
 * @param {object} options - Processing options
 * @param {string} negativeKeywords - Negative keywords
 * @returns {string} Video prompt
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
      : true,
  );

  return `${promptStr}\n\nFor this video file: Focus on motion, action, cinematography, and temporal elements. Include video-specific relevant keywords like 'motion', 'dynamic', 'cinematic', 'footage', 'clip', etc.`;
}

module.exports = { attemptVideoGeneration, buildRetryList, buildVideoPrompt };
