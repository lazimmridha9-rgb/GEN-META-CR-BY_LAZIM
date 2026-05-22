const {
  generatePrompt,
  getForbiddenKeywordsString,
  ensureMetadataArray,
} = require("../ai/prompt");
const { validateMetadata } = require("../validateMetadata");
const { executeGeminiApiCall } = require("../ai/errorHandler");
const {
  extractJsonStructure,
  extractTextFromResponse,
} = require("../../shared/helpers/jsonHelpers");
const { INITIAL_TIMEOUT, MAX_RETRIES } = require("../../config/constant");

/**
 * Processes a Gemini API call for metadata generation with exponential
 * backoff retries. Validates the response against quality standards.
 *
 * @param {Object} genAI - Gemini client instance.
 * @param {string} model - Model name.
 * @param {Object} generationConfig - Generation configuration.
 * @param {Object} geminiFile - Uploaded Gemini file reference.
 * @param {string} filePath - Original file path (for validation).
 * @param {Object} options - Processing options.
 * @param {string} apiKey - Gemini API key.
 * @returns {Promise<{metadata: Object|null, aiRequestSuccessful: boolean}>}
 */
async function processGeminiRetry(
  genAI,
  model,
  generationConfig,
  geminiFile,
  filePath,
  options,
  apiKey
) {
  const forbiddenKeywordsStr = getForbiddenKeywordsString(
    options.negativeKeywords
  );
  const fileExt =
    require("path").extname(filePath).toLowerCase().replace(".", "") || "jpg";

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
      : true
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
          parts: [
            geminiFile,
            { text: `${promptStr}: ${forbiddenKeywordsStr}` },
          ],
        },
      ];

      const result = await executeGeminiApiCall(async () => {
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

      const jsonResponse = extractTextFromResponse(result);
      const parsedMetadata = extractJsonStructure(jsonResponse);
      const metadataArray = ensureMetadataArray(parsedMetadata);

      if (metadataArray.length === 0) {
        throw new Error("No valid metadata found in response");
      }

      const candidate = metadataArray[0];
      if (!validateMetadata(candidate, require("path").basename(filePath))) {
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
      setTimeout(r, 1000 * Math.pow(2, retryCount) + Math.random() * 1000)
    );
  }

  return { metadata, aiRequestSuccessful };
}

module.exports = { processGeminiRetry };
