const {
  getKeywordInstruction,
  getCategoryInstructions,
  buildOutputFields,
} = require("./sharedUtils");
const { getBasePrompt, getVideoPrompt } = require("./promptBuilders");

/**
 * Builds a comma-separated string of forbidden keywords, optionally
 * including user-defined negative keywords.
 *
 * @param {string|null} [userNegativeKeywords=null] - Comma-separated user keywords to exclude.
 * @returns {string} Combined forbidden keywords string.
 */
const getForbiddenKeywordsString = (userNegativeKeywords = null) => {
  const { FORBIDDEN_KEYWORDS } = require("./categories");
  const combined = [...FORBIDDEN_KEYWORDS];
  if (userNegativeKeywords) {
    combined.push(
      ...userNegativeKeywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean)
    );
  }
  return combined.join(", ");
};

/**
 * Ensures the given metadata is an array. Wraps a single object
 * in an array if needed, or returns an empty array for invalid input.
 *
 * @param {*} metadata - The metadata value to normalize.
 * @returns {Array} An array of metadata objects.
 */
const ensureMetadataArray = (metadata) => {
  if (Array.isArray(metadata)) return metadata;
  if (metadata && typeof metadata === "object" && metadata.title)
    return [metadata];
  return [];
};

module.exports = {
  getForbiddenKeywordsString,
  ensureMetadataArray,
  getBasePrompt,
  getVideoPrompt,
};
