const {
  ADOBE_CATEGORIES,
  SHUTTERSTOCK_CATEGORIES_IMAGE,
  SHUTTERSTOCK_CATEGORIES_VIDEO,
} = require("./categories");

/**
 * Returns a keyword format instruction string based on the selected format.
 *
 * @param {string} keywordFormat - "single", "double", or "auto".
 * @returns {string} Instruction text for the prompt.
 */
const getKeywordInstruction = (keywordFormat) => {
  switch (keywordFormat) {
    case "single":
      return "single word,";
    case "double":
      return "double word phrases,";
    default:
      return "";
  }
};

/**
 * Maps file extensions to human-readable format labels.
 */
const FORMAT_MAP = {
  jpg: "JPG image",
  png: "PNG image",
  svg: "SVG vector image",
  eps: "Vector file",
  mp4: "VIDEO file",
  mov: "VIDEO file",
};

/**
 * Builds category instruction strings for Adobe Stock and Shutterstock.
 *
 * @param {boolean} enableAdobeStock - Whether to include Adobe categories.
 * @param {boolean} enableShutterstock - Whether to include Shutterstock categories.
 * @param {boolean} isVideo - Whether the media is a video.
 * @returns {{ adobe: string, shutterstock: string }} Category instruction strings.
 */
const getCategoryInstructions = (
  enableAdobeStock,
  enableShutterstock,
  isVideo
) => {
  let adobe = "";
  let shutterstock = "";

  if (enableAdobeStock) {
    adobe = `\n- Category: Select the ONE most relevant Adobe category and return ONLY its index number (1-16) from this list:\n${ADOBE_CATEGORIES.map(
      (c) => `  ${c.index}. ${c.name}`
    ).join("\n")}`;
  }

  if (enableShutterstock) {
    const cats = isVideo
      ? SHUTTERSTOCK_CATEGORIES_VIDEO
      : SHUTTERSTOCK_CATEGORIES_IMAGE;
    shutterstock = `\n- Categories: Select the TWO most relevant categories from this list (comma-separated): ${cats.join(
      ", "
    )}`;
  }

  return { adobe, shutterstock };
};

/**
 * Builds the output fields template for the JSON response schema.
 *
 * @param {boolean} enableAdobeStock - Include Adobe category field.
 * @param {boolean} enableShutterstock - Include Shutterstock categories field.
 * @returns {string} The formatted output fields string.
 */
const buildOutputFields = (enableAdobeStock, enableShutterstock) => {
  let fields = `"title": "Generated title",
      "description": "Generated description",
      "keywords": ["keyword1", "keyword2", ...]`;

  if (enableAdobeStock) fields += `,\n      "adobeCategory": 5`;
  if (enableShutterstock)
    fields += `,\n      "shutterstockCategories": "category1,category2"`;

  return fields;
};

module.exports = {
  getKeywordInstruction,
  FORMAT_MAP,
  getCategoryInstructions,
  buildOutputFields,
};
