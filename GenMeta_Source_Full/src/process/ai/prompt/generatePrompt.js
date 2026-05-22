const { getBasePrompt, getVideoPrompt } = require("./promptBuilders");
const { getForbiddenKeywordsString } = require("./basePrompt");

/**
 * Parses positive keywords from either an array or a JSON string.
 *
 * @param {Array|string} keywords - Keywords array or JSON string.
 * @returns {Array} Parsed array of keyword objects.
 */
const parsePositiveKeywords = (keywords) => {
  if (Array.isArray(keywords)) return keywords;
  try {
    return JSON.parse(keywords);
  } catch {
    return [];
  }
};

/**
 * Generates a complete prompt for the Gemini API based on the media format
 * and user-configured options.
 *
 * @param {string} format - Media format (jpg, png, svg, eps, mp4, mov).
 * @param {number} titleLength - Target title length in characters.
 * @param {string} titleLengthMode - "fixed" for exact length, "range" for 60-140.
 * @param {number} descriptionLength - Target description length.
 * @param {number} keywordCount - Number of keywords to generate.
 * @param {Array|string} [positiveKeywords=[]] - Keywords to include.
 * @param {string|null} [userNegativeKeywords=null] - Keywords to exclude.
 * @param {string} [keywordFormat="auto"] - "single", "double", or "auto".
 * @param {string|null} [customPrompt=null] - Custom prompt override.
 * @param {boolean} [enableCustomPrompt=false] - Whether to use the custom prompt.
 * @param {string|null} [additionalPromptText=null] - Additional instructions to append.
 * @param {boolean} [enableAdobeStockCategories=false] - Include Adobe category selection.
 * @param {boolean} [enableShutterstockCategories=true] - Include Shutterstock category selection.
 * @returns {string} The complete prompt string for the AI.
 */
function generatePrompt(
  format,
  titleLength,
  titleLengthMode,
  descriptionLength,
  keywordCount,
  positiveKeywords = [],
  userNegativeKeywords = null,
  keywordFormat = "auto",
  customPrompt = null,
  enableCustomPrompt = false,
  additionalPromptText = null,
  enableAdobeStockCategories = false,
  enableShutterstockCategories = true
) {
  const normalized = format.toLowerCase() === "jpeg" ? "jpg" : format.toLowerCase();
  const FORMAT_MAP = {
    jpg: "JPG image",
    png: "PNG image",
    svg: "SVG vector image",
    eps: "Vector file",
    mp4: "VIDEO file",
    mov: "VIDEO file",
  };

  if (!FORMAT_MAP[normalized]) {
    throw new Error(`Unsupported format: ${format}`);
  }

  const isVideo = normalized === "mp4" || normalized === "mov";

  // Build the base prompt for the media type
  let basePrompt = isVideo
    ? getVideoPrompt(
        titleLength,
        titleLengthMode,
        descriptionLength,
        keywordCount,
        keywordFormat,
        enableAdobeStockCategories,
        enableShutterstockCategories
      )
    : getBasePrompt(
        FORMAT_MAP[normalized],
        titleLength,
        titleLengthMode,
        descriptionLength,
        keywordCount,
        keywordFormat,
        enableAdobeStockCategories,
        enableShutterstockCategories
      );

  // Append positive keyword instructions if applicable
  let positiveText = "";
  const positiveArr = parsePositiveKeywords(positiveKeywords);
  if (Array.isArray(positiveArr) && positiveArr.length > 0) {
    const applicable = positiveArr.filter(
      (k) =>
        k &&
        k.text &&
        k.target &&
        Array.isArray(k.filetypes) &&
        k.filetypes.includes(normalized)
    );
    const allTargets = applicable
      .filter((k) => k.target === "all")
      .map((k) => k.text);
    const keywordOnly = applicable
      .filter((k) => k.target === "keywords")
      .map((k) => k.text);

    if (allTargets.length > 0) {
      positiveText += `Include naturally the following words in the title, description, AND keywords where contextually appropriate: ${allTargets.join(", ")}.\n\n`;
    }
    if (keywordOnly.length > 0) {
      positiveText += `Include the following words in the KEYWORDS LIST ONLY, if contextually appropriate: ${keywordOnly.join(", ")}.\n\n`;
    }
  }

  // Build the forbidden keywords string
  const forbiddenString = getForbiddenKeywordsString(userNegativeKeywords);

  // Assemble the complete prompt
  let completePrompt;
  if (enableCustomPrompt && customPrompt?.trim()) {
    // Use custom prompt with optional additional instructions
    completePrompt = customPrompt.trim();
    if (additionalPromptText?.trim()) {
      completePrompt += `\n\nAdditional instructions (must apply where contextually appropriate): ${additionalPromptText.trim()}`;
    }
  } else {
    // Use generated base prompt
    completePrompt = basePrompt + (positiveText || "");
    if (additionalPromptText?.trim()) {
      completePrompt += `Additional instructions (must apply where contextually appropriate): ${additionalPromptText.trim()}\n\n`;
    }
    completePrompt += `Never include the following forbidden words in any title, description, or keyword: ${forbiddenString}.`;
  }

  return completePrompt;
}

module.exports = generatePrompt;
