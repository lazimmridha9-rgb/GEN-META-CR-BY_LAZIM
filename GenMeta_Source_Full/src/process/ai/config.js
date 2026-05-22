const { GoogleGenAI } = require("@google/genai");

/**
 * Creates a Gemini API configuration with the provided API key and model.
 *
 * @param {string} apiKey - The Google Gemini API key.
 * @param {string} [geminiModel="gemini-2.5-flash"] - The model identifier to use.
 * @returns {{ genAI: GoogleGenAI, model: string, generationConfig: Object, modelOptions: Object }}
 *   The configured Gemini client, model name, generation config, and model options.
 * @throws {Error} If the API key is missing or empty.
 */
function getGeminiConfig(apiKey, geminiModel = "gemini-2.5-flash") {
  /**
   * Masks an API key for safe logging, showing only the first and last 4 characters.
   *
   * @param {string} key - The API key to mask.
   * @returns {string} The masked key, or "***" if too short.
   */
  function maskApiKey(key) {
    if (!key || key.length < 8) return "***";
    return key.substring(0, 4) + "***" + key.substring(key.length - 4);
  }

  console.log(`Using Gemini API Key: ${maskApiKey(apiKey)}, Model: ${geminiModel}`);

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
