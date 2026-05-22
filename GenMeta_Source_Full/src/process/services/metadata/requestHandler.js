const { uploadToGemini } = require("../../uploadGemini");
const { generatePrompt } = require("../../ai/prompt/index");
const getGeminiConfig = require("../../ai/config");
const { executeGeminiApiCall } = require("../../ai/errorHandler");
const { extractTextFromResponse } = require("../../../shared/helpers/jsonHelpers");

/**
 * Makes a Gemini API request with the provided configuration, applying
 * a timeout and extracting the text response.
 *
 * @param {Object} genAI - Gemini client instance.
 * @param {string} model - Model name.
 * @param {Object} generationConfig - Generation configuration.
 * @param {Array<Object>} parts - File parts to include in the request.
 * @param {Array<Object>} preparedMedia - Prepared media items for prompt generation.
 * @param {number} timeout - Request timeout in milliseconds.
 * @returns {Promise<{text: string}>} The text response from Gemini.
 */
async function makeGeminiRequest(
  genAI,
  model,
  generationConfig,
  parts,
  preparedMedia,
  timeout
) {
  const completePrompt = generateCompletePrompt(preparedMedia);
  const contents = [
    { role: "user", parts: [...parts, { text: completePrompt }] },
  ];

  const response = await executeGeminiApiCall(async () => {
    return Promise.race([
      genAI.models.generateContent({
        model,
        config: generationConfig,
        contents,
      }),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`Gemini API timeout after ${timeout}ms`)),
          timeout
        )
      ),
    ]);
  });

  return { text: extractTextFromResponse(response) };
}

/**
 * Generates the complete prompt for a batch of media files,
 * using the primary file format and processing options.
 *
 * @param {Array<Object>} preparedMedia - Prepared media items.
 * @returns {string} The complete prompt string.
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
      : true
  );

  const hasVideo = preparedMedia.some((item) => item.mediaType === "video");
  return hasVideo
    ? `${prompt}\n\nFor video files: Focus on motion, action, cinematography, and temporal elements. Include video-specific keywords like 'motion', 'dynamic', 'cinematic', 'footage', 'clip', etc.`
    : prompt;
}

/**
 * Determines the primary file format in a batch by counting occurrences.
 *
 * @param {Array<Object>} preparedMedia - Prepared media items.
 * @returns {string} The most common format.
 */
function getPrimaryFileFormat(preparedMedia) {
  const { getFileFormat } = require("./formatHelper");
  const formatCounts = {};

  preparedMedia.forEach((item) => {
    const format = getFileFormat(item.originalMedia?.path || "");
    formatCounts[format] = (formatCounts[format] || 0) + 1;
  });

  return Object.keys(formatCounts).reduce(
    (a, b) => (formatCounts[a] > formatCounts[b] ? a : b),
    "jpg"
  );
}

/**
 * Uploads all prepared media files to Gemini in parallel.
 *
 * @param {Array<Object>} preparedMedia - Prepared media items.
 * @param {string} apiKey - API key for upload.
 * @returns {Promise<Array<{file: Object, originalItem: Object}>>} Uploaded file references.
 */
async function uploadFilesToGemini(preparedMedia, apiKey) {
  return Promise.all(
    preparedMedia.map(async (item) => {
      const uploadPath =
        item.mediaType === "video" ? item.processPath : item.resizedPath;
      return {
        file: await uploadToGemini(uploadPath, item.mimeType, apiKey),
        originalItem: item,
      };
    })
  );
}

module.exports = { makeGeminiRequest, uploadFilesToGemini, generateCompletePrompt };
