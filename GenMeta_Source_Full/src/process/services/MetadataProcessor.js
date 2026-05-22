const getGeminiConfig = require("../ai/config");
const ProcessingStateManager = require("./ProcessingStateManager");
const CONSTANTS = require("../../config/constant");
const {
  uploadFilesToGemini,
  makeGeminiRequest,
} = require("./metadata/requestHandler");
const {
  parseAndValidateResponse,
} = require("./metadata/responseParser");
const {
  buildRetryList,
  isQuotaError,
  switchToKeyAndModel,
} = require("./metadata/keyRotator");
const { maskApiKey } = require("../../shared/helpers/maskUtils");

/**
 * Handles metadata generation for media files using the Gemini API.
 * Supports API key rotation and model fallback on failures.
 */
class MetadataProcessor {
  /**
   * Creates a new MetadataProcessor.
   *
   * @param {Array<string>|string} apiKey - API key(s) for Gemini.
   * @param {Object} options - Processing options including geminiModel.
   */
  constructor(apiKey, options) {
    this.apiKeys = Array.isArray(apiKey) ? apiKey : [apiKey];
    this.apiKey = this.apiKeys[0];
    this.options = options;
    this.currentModel = options.geminiModel;

    const { genAI, model, generationConfig } = getGeminiConfig(
      this.apiKey,
      this.currentModel
    );
    this.genAI = genAI;
    this.model = model;
    this.generationConfig = generationConfig;
  }

  /**
   * Generates metadata for an array of prepared media items.
   *
   * @param {Array<Object>} preparedMedia - Array of prepared media objects.
   * @returns {Promise<Array<Object>>} Array of metadata objects.
   */
  async processMetadata(preparedMedia) {
    ProcessingStateManager.checkAndThrowIfStopped("metadata processing");
    const geminiFiles = await uploadFilesToGemini(
      preparedMedia,
      this.apiKey
    );
    return this._generateMetadata(geminiFiles, preparedMedia);
  }

  /**
   * Internal method that handles the Gemini API request with retries
   * and key/model fallback.
   *
   * @param {Array<Object>} geminiFiles - Uploaded Gemini file references.
   * @param {Array<Object>} preparedMedia - Prepared media objects.
   * @returns {Promise<Array<Object>>} Validated metadata array.
   */
  async _generateMetadata(geminiFiles, preparedMedia) {
    const parts = geminiFiles.map(({ file }) => file);
    const originalApiKey = this.apiKey;
    const originalModel = this.currentModel;
    let lastError = null;

    // Initial retry loop with current key/model
    for (
      let retryCount = 0;
      retryCount <= CONSTANTS.MAX_RETRIES;
      retryCount++
    ) {
      ProcessingStateManager.checkAndThrowIfStopped("metadata retry loop");
      const timeout = CONSTANTS.INITIAL_TIMEOUT * (1 + retryCount);

      try {
        const result = await makeGeminiRequest(
          this.genAI,
          this.model,
          this.generationConfig,
          parts,
          preparedMedia,
          timeout
        );
        const metadataArray = await parseAndValidateResponse(
          result.text,
          preparedMedia,
          retryCount,
          this.options
        );
        if (metadataArray) return metadataArray;
      } catch (apiError) {
        lastError = apiError;
        console.warn(
          `[MetadataProcessor] Attempt ${retryCount + 1} failed with ${maskApiKey(this.apiKey)} + ${this.currentModel}: ${apiError.message}`
        );
        if (retryCount < CONSTANTS.MAX_RETRIES) {
          await this._waitWithJitter(retryCount + 1);
        }
      }
    }

    // Try alternative key/model combinations from the tracker
    console.log(
      "[MetadataProcessor] Initial attempts failed, checking tracker for alternative combos..."
    );
    const retryCombos = buildRetryList(
      originalApiKey,
      originalModel,
      this.apiKeys
    );
    if (retryCombos.length > 0) {
      console.log(
        `[MetadataProcessor] Found ${retryCombos.length} alternative key-model combinations to try`
      );
    }

    for (const combo of retryCombos) {
      ProcessingStateManager.checkAndThrowIfStopped(
        "metadata retry with alternative combo"
      );
      const config = switchToKeyAndModel(combo.apiKey, combo.model);
      this.genAI = config.genAI;
      this.model = config.model;
      this.generationConfig = config.generationConfig;
      this.apiKey = combo.apiKey;
      this.currentModel = combo.model;

      try {
        const result = await makeGeminiRequest(
          this.genAI,
          this.model,
          this.generationConfig,
          parts,
          preparedMedia,
          CONSTANTS.INITIAL_TIMEOUT
        );
        const metadataArray = await parseAndValidateResponse(
          result.text,
          preparedMedia,
          0,
          this.options
        );
        if (metadataArray) return metadataArray;
      } catch (error) {
        lastError = error;
        console.warn(
          `[MetadataProcessor] Failed with ${maskApiKey(combo.apiKey)} + ${combo.model}: ${error.message}`
        );
      }
    }

    throw new Error(
      lastError?.message ||
        "Failed to get valid metadata after trying all key-model combinations"
    );
  }

  /**
   * Waits with exponential backoff and random jitter.
   *
   * @param {number} retryCount - The current retry attempt number.
   */
  async _waitWithJitter(retryCount) {
    const baseDelay = 1000 * Math.pow(2, retryCount);
    await new Promise((resolve) =>
      setTimeout(resolve, baseDelay + Math.random() * 1000)
    );
  }

  /**
   * Generates metadata for a single media item with key/model retry.
   *
   * @param {Object} item - Prepared media item.
   * @param {number} index - Index in the batch.
   * @returns {Promise<Object>} Metadata for the single item.
   */
  async processSingleMediaMetadata(item, index) {
    const originalApiKey = this.apiKey;
    const originalModel = this.currentModel;
    let lastError = null;

    // First attempt with current key/model
    try {
      const uploadPath =
        item.mediaType === "video" ? item.processPath : item.resizedPath;
      const { uploadToGemini } = require("../uploadGemini");
      const singleFile = await uploadToGemini(
        uploadPath,
        item.mimeType,
        this.apiKey
      );
      return this._generateSingleMetadata(item, singleFile, index);
    } catch (error) {
      lastError = error;
    }

    // Retry with alternative key/model combinations
    const retryCombos = buildRetryList(
      originalApiKey,
      originalModel,
      this.apiKeys
    );
    for (const combo of retryCombos) {
      const config = switchToKeyAndModel(combo.apiKey, combo.model);
      this.genAI = config.genAI;
      this.model = config.model;
      this.generationConfig = config.generationConfig;
      this.apiKey = combo.apiKey;
      this.currentModel = combo.model;

      try {
        const uploadPath =
          item.mediaType === "video" ? item.processPath : item.resizedPath;
        const { uploadToGemini } = require("../uploadGemini");
        const singleFile = await uploadToGemini(
          uploadPath,
          item.mimeType,
          this.apiKey
        );
        return this._generateSingleMetadata(item, singleFile, index);
      } catch (error) {
        lastError = error;
      }
    }

    throw new Error(
      lastError?.message ||
        "Failed to process single media metadata after trying all key-model combinations"
    );
  }

  /**
   * Generates and validates metadata for a single media file.
   *
   * @param {Object} item - Prepared media item.
   * @param {Object} singleMediaFile - Uploaded Gemini file reference.
   * @param {number} index - Index in the batch.
   * @returns {Promise<Object>} Validated metadata object.
   */
  async _generateSingleMetadata(item, singleMediaFile, index) {
    const { generatePrompt } = require("../ai/prompt/index");
    const { executeGeminiApiCall } = require("../ai/errorHandler");
    const { extractTextFromResponse } = require("../../shared/helpers/jsonHelpers");
    const { validateMetadata } = require("../validateMetadata");
    const { getFileFormat, getFilename } = require("./metadata/formatHelper");

    const fileFormat = getFileFormat(item.originalMedia.path);
    const prompt = generatePrompt(
      fileFormat,
      this.options.titleLength || 90,
      this.options.titleLengthMode || "fixed",
      this.options.descriptionLength || 120,
      this.options.keywordCount || 25,
      this.options.positiveKeywords || [],
      this.options.negativeKeywords,
      this.options.keywordFormat || "auto",
      this.options.customPrompt,
      this.options.enableCustomPrompt || false,
      this.options.additionalPromptText,
      this.options.enableAdobeStockCategories || false,
      this.options.enableShutterstockCategories !== undefined
        ? this.options.enableShutterstockCategories
        : true
    );

    const isVideo = item.mediaType === "video";
    const finalPrompt = isVideo
      ? `${prompt}\n\nFor this video file: Focus on motion, action, cinematography, and temporal elements.`
      : prompt;

    const result = await executeGeminiApiCall(async () => {
      return this.genAI.models.generateContent({
        model: this.model,
        config: this.generationConfig,
        contents: [
          {
            role: "user",
            parts: [
              singleMediaFile,
              { text: finalPrompt },
            ],
          },
        ],
      });
    });

    // Parse and validate the response
    let responseText = extractTextFromResponse(result);
    let cleaned = responseText
      .replace(/^```json\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    const { extractJsonStructure } = require("../../shared/helpers/jsonHelpers");
    let parsed = JSON.parse(cleaned);
    const { ensureMetadataArray } = require("../ai/prompt/index");
    const arr = ensureMetadataArray(parsed);

    if (arr.length === 0) {
      throw new Error("No valid metadata found in response");
    }

    let meta = arr[0];

    if (validateMetadata(meta, getFilename(item, index))) {
      // Optionally append periods to title and description
      if (
        this.options.addPeriodTitle !== false ||
        this.options.addPeriodDescription !== false
      ) {
        if (
          this.options.addPeriodTitle !== false &&
          meta.title &&
          typeof meta.title === "string" &&
          !meta.title.trim().endsWith(".")
        ) {
          meta.title = meta.title.trim() + ".";
        }
        if (
          this.options.addPeriodDescription !== false &&
          meta.description &&
          typeof meta.description === "string" &&
          !meta.description.trim().endsWith(".")
        ) {
          meta.description = meta.description.trim() + ".";
        }
      }
      return meta;
    }

    throw new Error("Invalid metadata for single media file");
  }
}

module.exports = MetadataProcessor;
