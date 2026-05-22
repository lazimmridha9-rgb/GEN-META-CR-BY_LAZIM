const { GoogleGenAI } = require("@google/genai");

/**
 * Mask API key for safe logging
 * @param {string} apiKey - The API key to mask
 * @returns {string} Masked key (first 4 + *** + last 4)
 */
function maskApiKey(apiKey) {
  if (!apiKey || apiKey.length < 8) return "***";
  return `${apiKey.substring(0, 4)}***${apiKey.substring(apiKey.length - 4)}`;
}

/**
 * Create Gemini AI client configuration
 * @param {string} apiKey - Google Gemini API key
 * @param {string} [geminiModel="gemini-2.5-flash"] - Model identifier
 * @returns {{ genAI: GoogleGenAI, model: string, generationConfig: object, modelOptions: object }}
 */
function getGeminiConfig(apiKey, geminiModel = "gemini-2.5-flash") {
  console.log(
    `Using Gemini API Key: ${maskApiKey(apiKey)}, Model: ${geminiModel}`,
  );

  if (!apiKey) {
    throw new Error("Gemini API key is required");
  }

  const genAI = new GoogleGenAI({ apiKey });
  const model = geminiModel;

  const generationConfig = {
    thinkingConfig: {
      thinkingBudget: 0,
    },
    responseMimeType: "application/json",
  };

  const modelOptions = {
    apiVersion: "v1",
    timeout: 90000,
  };

  return { genAI, model, generationConfig, modelOptions };
}

module.exports = getGeminiConfig;
