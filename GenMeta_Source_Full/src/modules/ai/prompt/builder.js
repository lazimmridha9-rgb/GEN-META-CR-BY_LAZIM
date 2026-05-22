const { getBasePrompt, getVideoPrompt } = require("./templates");
const { getForbiddenKeywordsString } = require("./keywords");

/**
 * Parse positive keywords from array or JSON string
 * @param {string|object[]} keywords - Keywords array or JSON string
 * @returns {object[]} Parsed keywords array
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
 * Generate a complete prompt for metadata generation based on file format and options
 * @param {string} format - File format (jpg, png, svg, eps, mp4, mov)
 * @param {number} titleLength - Target title length
 * @param {string} titleLengthMode - "fixed" or "range"
 * @param {number} descriptionLength - Target description length
 * @param {number} keywordCount - Number of keywords to generate
 * @param {object[]|string} positiveKeywords - Keywords to include
 * @param {string|null} userNegativeKeywords - User-defined forbidden keywords
 * @param {string} keywordFormat - "single", "double", or "auto"
 * @param {string|null} customPrompt - Custom prompt override
 * @param {boolean} enableCustomPrompt - Whether to use custom prompt
 * @param {string|null} additionalPromptText - Additional instructions to append
 * @param {boolean} enableAdobeStockCategories - Include Adobe categories
 * @param {boolean} enableShutterstockCategories - Include Shutterstock categories
 * @returns {string} Complete prompt string
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
  enableShutterstockCategories = true,
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

  // Select prompt template based on media type
  let basePrompt = isVideo
    ? getVideoPrompt(
        titleLength,
        titleLengthMode,
        descriptionLength,
        keywordCount,
        keywordFormat,
        enableAdobeStockCategories,
        enableShutterstockCategories,
      )
    : getBasePrompt(
        FORMAT_MAP[normalized],
        titleLength,
        titleLengthMode,
        descriptionLength,
        keywordCount,
        keywordFormat,
        enableAdobeStockCategories,
        enableShutterstockCategories,
      );

  // Build positive keyword instructions
  let positiveText = "";
  const positiveArr = parsePositiveKeywords(positiveKeywords);

  if (Array.isArray(positiveArr) && positiveArr.length > 0) {
    const applicable = positiveArr.filter(
      (k) =>
        k &&
        k.text &&
        k.target &&
        Array.isArray(k.filetypes) &&
        k.filetypes.includes(normalized),
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

  const forbiddenString = getForbiddenKeywordsString(userNegativeKeywords);
  let completePrompt;

  if (enableCustomPrompt && customPrompt?.trim()) {
    // Use custom prompt as the base
    completePrompt = customPrompt.trim();
    if (additionalPromptText?.trim()) {
      completePrompt += `\n\nAdditional instructions (must apply where contextually appropriate): ${additionalPromptText.trim()}`;
    }
  } else {
    // Use standard prompt with positive keywords and forbidden words
    completePrompt = basePrompt + (positiveText || "");
    if (additionalPromptText?.trim()) {
      completePrompt += `Additional instructions (must apply where contextually appropriate): ${additionalPromptText.trim()}\n\n`;
    }
    completePrompt += `Never include the following forbidden words in any title, description, or keyword: ${forbiddenString}.`;
  }

  return completePrompt;
}

module.exports = generatePrompt;
