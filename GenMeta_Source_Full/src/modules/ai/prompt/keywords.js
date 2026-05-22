const { FORBIDDEN_KEYWORDS } = require("./categories");
const { getKeywordInstruction, getCategoryInstructions, buildOutputFields } = require("./format");
const { getBasePrompt, getVideoPrompt } = require("./templates");

/**
 * Build a comma-separated string of forbidden keywords, including user-defined negatives
 * @param {string|null} userNegativeKeywords - User-defined negative keywords (comma-separated)
 * @returns {string} Combined forbidden keywords string
 */
const getForbiddenKeywordsString = (userNegativeKeywords = null) => {
  const combined = [...FORBIDDEN_KEYWORDS];

  if (userNegativeKeywords) {
    combined.push(
      ...userNegativeKeywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
    );
  }

  return combined.join(", ");
};

/**
 * Ensure metadata is always returned as an array
 * @param {object|object[]} metadata - Single object or array of metadata objects
 * @returns {object[]} Array of metadata objects
 */
const ensureMetadataArray = (metadata) => {
  if (Array.isArray(metadata)) return metadata;
  if (metadata && typeof metadata === "object" && metadata.title) return [metadata];
  return [];
};

module.exports = { getForbiddenKeywordsString, ensureMetadataArray, getBasePrompt, getVideoPrompt };
