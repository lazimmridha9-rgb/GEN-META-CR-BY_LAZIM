const { uploadToGemini } = require("../ai/uploader");
const { generatePrompt } = require("../ai/prompt");
const getGeminiConfig = require("../ai/client");
const { executeGeminiApiCall } = require("../ai/error-handler");
const { extractTextFromResponse } = require("../../shared/helpers/json-helpers");

/**
 * Make a Gemini API request with timeout protection
 * @param {object} genAI - Gemini AI client
 * @param {string} model - Model identifier
 * @param {object} generationConfig - Generation config
 * @param {object[]} parts - File parts for the request
 * @param {object[]} preparedMedia - Prepared media items
 * @param {number} timeout - Request timeout in ms
 * @returns {Promise<{text: string}>} Response text
 */
async function makeGeminiRequest(
  genAI,
  model,
  generationConfig,
  parts,
  preparedMedia,
  timeout,
) {
  const completePrompt = generateCompletePrompt(preparedMedia);
  const contents = [
    { role: "user", parts: [...parts, { text: completePrompt }] },
  ];

  const response = await executeGeminiApiCall(async () => {
    return await Promise.race([
      genAI.models.generateContent({
        model,
        config: generationConfig,
        contents,
      }),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`Gemini API timeout after ${timeout}ms`)),
          timeout,
        ),
      ),
    ]);
  });

  return { text: extractTextFromResponse(response) };
}

/**
 * Generate a complete prompt for batch metadata generation
 * @param {object[]} preparedMedia - Prepared media items
 * @returns {string} Complete prompt string
 */
function generateCompletePrompt(preparedMedia) {
  const primaryFormat = getPrimaryFileFormat(preparedMedia);
  const sample = preparedMedia[0];
  const options = sample?.originalMedia?._processingOptions || {};

  const prompt = generatePrompt(
    primaryFormat,
    options.titleLength || 90,
    options.titleLengthMode || "fixed",
    options.descriptionLength || 120,
    options.keywordCount || 25,
    options.positiveKeywords || [],
    options.negativeKeywords,
    options.keywordFormat || "auto",
    options.customPrompt,
    options.enableCustomPrompt || false,
    options.additionalPromptText,
    options.enableAdobeStockCategories || false,
    options.enableShutterstockCategories !== undefined
      ? options.enableShutterstockCategories
      : true,
  );

  const hasVideo = preparedMedia.some((item) => item.mediaType === "video");

  return hasVideo
    ? `${prompt}\n\nFor video files: Focus on motion, action, cinematography, and temporal elements. Include video-specific keywords like 'motion', 'dynamic', 'cinematic', 'footage', 'clip', etc.`
    : prompt;
}

/**
 * Determine the primary file format in a batch (most common)
 * @param {object[]} preparedMedia - Prepared media items
 * @returns {string} Most common format
 */
function getPrimaryFileFormat(preparedMedia) {
  const { getFileFormat } = require("./format");

  const formatCounts = {};
  preparedMedia.forEach((item) => {
    const format = getFileFormat(item.originalMedia?.path || "");
    formatCounts[format] = (formatCounts[format] || 0) + 1;
  });

  return Object.keys(formatCounts).reduce(
    (a, b) => (formatCounts[a] > formatCounts[b] ? a : b),
    "jpg",
  );
}

/**
 * Upload all prepared media files to Gemini
 * @param {object[]} preparedMedia - Prepared media items
 * @param {string} apiKey - API key
 * @returns {Promise<{file: object, originalItem: object}[]>}
 */
async function uploadFilesToGemini(preparedMedia, apiKey) {
  return await Promise.all(
    preparedMedia.map(async (item) => {
      const uploadPath =
        item.mediaType === "video" ? item.processPath : item.resizedPath;
      return {
        file: await uploadToGemini(uploadPath, item.mimeType, apiKey),
        originalItem: item,
      };
    }),
  );
}

module.exports = { generateCompletePrompt, makeGeminiRequest, uploadFilesToGemini };
