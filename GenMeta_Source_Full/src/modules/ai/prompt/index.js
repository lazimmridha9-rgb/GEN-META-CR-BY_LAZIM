const {
  ADOBE_CATEGORIES,
  FORBIDDEN_KEYWORDS,
  SHUTTERSTOCK_CATEGORIES_IMAGE,
  SHUTTERSTOCK_CATEGORIES_VIDEO,
  getCategoryIndex,
} = require("./categories");
const { getBasePrompt, getVideoPrompt } = require("./templates");
const { ensureMetadataArray, getForbiddenKeywordsString } = require("./keywords");
const generatePrompt = require("./builder");

module.exports = {
  ADOBE_CATEGORIES,
  FORBIDDEN_KEYWORDS,
  SHUTTERSTOCK_CATEGORIES_IMAGE,
  SHUTTERSTOCK_CATEGORIES_VIDEO,
  ensureMetadataArray,
  generatePrompt,
  getBasePrompt,
  getCategoryIndex,
  getForbiddenKeywordsString,
  getVideoPrompt,
};
