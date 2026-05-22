const path = require("path");

const {
  ensureMetadataArray,
  generatePrompt,
  getForbiddenKeywordsString,
} = require("../ai/prompt");
const { executeGeminiApiCall } = require("../ai/error-handler");
const {
  extractJsonStructure,
  extractTextFromResponse,
} = require("../../shared/helpers/json-helpers");
const { INITIAL_TIMEOUT, MAX_RETRIES } = require("../../config/constants");
const { validateMetadata } = require("../metadata/validator");

/**
 * Process metadata generation with retry logic for a single file
 * @param {object} genAI - Gemini AI client
 * @param {string} model - Model identifier
 * @param {object} generationConfig - Generation configuration
 * @param {object} geminiFile - File part for Gemini API
 * @param {string} filePath - Original file path
 * @param {object} options - Processing options
 * @param {string} apiKey - API key in use
 * @returns {Promise<{metadata: object|null, aiRequestSuccessful: boolean}>}
 */
async function processGeminiRetry(
  genAI,
  model,
  generationConfig,
  geminiFile,
  filePath,
  options,
  apiKey,
) {
  const forbiddenKeywordsStr = getForbiddenKeywordsString(
    options.negativeKeywords,
  );
  const fileExt =
    path.extname(filePath).toLowerCase().replace(".", "") || "jpg";

  const promptStr = generatePrompt(
    fileExt,
    options.titleLength || 90,
    options.titleLengthMode || "fixed",
    options.descriptionLength || 120,
    options.keywordCount || 25,
    options.positiveKeywords,
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

  let metadata = null;
  let retryCount = 0;
  let aiRequestSuccessful = false;

  while (retryCount < MAX_RETRIES) {
    const timeout = INITIAL_TIMEOUT * (1 + retryCount);

    try {
      const contents = [
        {
          role: "user",
          parts: [geminiFile, { text: `${promptStr}: ${forbiddenKeywordsStr}` }],
        },
      ];

      const result = await executeGeminiApiCall(async () => {
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

      const jsonResponse = extractTextFromResponse(result);
      const parsedMetadata = extractJsonStructure(jsonResponse);
      const metadataArray = ensureMetadataArray(parsedMetadata);

      if (metadataArray.length === 0) {
        throw new Error("No valid metadata found in response");
      }

      const candidate = metadataArray[0];
      if (!validateMetadata(candidate, path.basename(filePath))) {
        console.warn(`Attempt ${retryCount + 1}: Invalid metadata format`);
        throw new Error("Invalid metadata format");
      }

      metadata = candidate;
      aiRequestSuccessful = true;
      break;
    } catch (apiError) {
      console.warn(`Attempt ${retryCount + 1}: ${apiError.message}`);
      if (retryCount === MAX_RETRIES - 1) throw apiError;
    }

    retryCount++;
    await new Promise((r) =>
      setTimeout(
        r,
        1000 * Math.pow(2, retryCount) + Math.random() * 1000,
      ),
    );
  }

  return { metadata, aiRequestSuccessful };
}

module.exports = { processGeminiRetry };
