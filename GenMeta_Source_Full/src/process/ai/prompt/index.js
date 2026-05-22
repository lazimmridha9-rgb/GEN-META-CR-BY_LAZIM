const {
  FORBIDDEN_KEYWORDS,
  ADOBE_CATEGORIES,
  SHUTTERSTOCK_CATEGORIES_IMAGE,
  SHUTTERSTOCK_CATEGORIES_VIDEO,
  getCategoryIndex,
} = require("./categories");
const { getBasePrompt, getVideoPrompt } = require("./promptBuilders");
const {
  getForbiddenKeywordsString,
  ensureMetadataArray,
} = require("./basePrompt");
const generatePrompt = require("./generatePrompt");

module.exports = {
  FORBIDDEN_KEYWORDS,
  ADOBE_CATEGORIES,
  SHUTTERSTOCK_CATEGORIES_IMAGE,
  SHUTTERSTOCK_CATEGORIES_VIDEO,
  getCategoryIndex,
  getBasePrompt,
  getVideoPrompt,
  getForbiddenKeywordsString,
  ensureMetadataArray,
  generatePrompt,
};
