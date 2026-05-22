// Node modules
const path = require("path");
const fs = require("fs");

/**
 * Creates a set of helper functions for CSV generation.
 *
 * @param {string} [newExtension] - Optional new file extension to apply to filenames.
 * @returns {Object} Helper functions for CSV processing.
 */
const createHelpers = (newExtension) => ({
  /**
   * Processes a filename, optionally replacing its extension.
   *
   * @param {string} filename - The original filename.
   * @returns {string} The processed filename.
   */
  processFilename: (filename) => {
    if (newExtension) {
      const lastDotIndex = filename.lastIndexOf(".");
      if (lastDotIndex > 0) {
        return filename.substring(0, lastDotIndex) + newExtension;
      }
      return filename + newExtension;
    }
    return filename;
  },

  /**
   * Cleans a value for safe CSV inclusion, escaping quotes and wrapping if needed.
   *
   * @param {*} value - The value to clean.
   * @returns {string} CSV-safe string representation.
   */
  cleanValue: (value) => {
    if (!value) return '""';
    const cleaned = String(value)
      .replace(/\r?\n/g, " ")
      .replace(/"/g, '""');
    return cleaned.includes(",") ? `"${cleaned}"` : cleaned;
  },

  /**
   * Formats keywords for CSV, handling arrays and special characters.
   *
   * @param {string|string[]} keywords - Keywords to format.
   * @returns {string} CSV-safe keywords string.
   */
  formatKeywords: (keywords) => {
    if (!keywords) return '""';

    if (Array.isArray(keywords)) {
      const joined = keywords
        .join(", ")
        .replace(/\r?\n/g, " ")
        .replace(/"/g, '""');
      return `"${joined}"`;
    }

    const cleaned = String(keywords)
      .replace(/\r?\n/g, " ")
      .replace(/"/g, '""');
    return cleaned.includes(",") ? `"${cleaned}"` : cleaned;
  },

  /**
   * Generates a unique file path by appending a counter if the file already exists.
   *
   * @param {string} directory - Target directory.
   * @param {string} baseName - Base filename without extension.
   * @param {string} extension - File extension.
   * @returns {string} Unique full file path.
   */
  getUniqueFilename: (directory, baseName, extension) => {
    let filename = `${baseName}${extension}`;
    let fullPath = path.join(directory, filename);
    let counter = 1;

    while (fs.existsSync(fullPath)) {
      filename = `${baseName}_${counter}${extension}`;
      fullPath = path.join(directory, filename);
      counter++;
    }

    return fullPath;
  },
});

/**
 * CSV generator functions for different stock photo markets.
 */
const CSV_GENERATORS = {
  /**
   * General CSV format: Filename, Title, Keywords, Description
   */
  general: (data, helpers) => {
    const { processFilename, cleanValue, formatKeywords } = helpers;
    let csv = "Filename,Title,Keywords,Description\n";

    for (const item of data) {
      csv +=
        `${cleanValue(processFilename(item.filename))},` +
        `${cleanValue(item.title)},` +
        `${formatKeywords(item.keywords)},` +
        `${cleanValue(item.description)}\n`;
    }

    return csv;
  },

  /**
   * Adobe Stock CSV format: Filename, Title, Keywords, Category
   */
  adobestock: (data, helpers) => {
    const { processFilename, cleanValue, formatKeywords } = helpers;
    let csv = "Filename,Title,Keywords,Category\n";

    for (const item of data) {
      csv +=
        `${cleanValue(processFilename(item.filename))},` +
        `${cleanValue(item.title)},` +
        `${formatKeywords(item.keywords)},` +
        `${item.adobeCategory || '""'}\n`;
    }

    return csv;
  },

  /**
   * Freepik CSV format: File name, Title, Keywords
   */
  freepik: (data, helpers) => {
    const { processFilename, cleanValue, formatKeywords } = helpers;
    let csv = "File name,Title,Keywords\n";

    for (const item of data) {
      csv +=
        `${cleanValue(processFilename(item.filename))},` +
        `${cleanValue(item.title)},` +
        `${formatKeywords(item.keywords)}\n`;
    }

    return csv;
  },

  /**
   * Shutterstock CSV format: Filename, Description, Keywords, Categories
   */
  shutterstock: (data, helpers) => {
    const { processFilename, cleanValue, formatKeywords } = helpers;
    let csv = "Filename,Description,Keywords,Categories\n";

    for (const item of data) {
      csv +=
        `${cleanValue(processFilename(item.filename))},` +
        `${cleanValue(item.description)},` +
        `${formatKeywords(item.keywords)},` +
        `${item.shutterstockCategories ? cleanValue(item.shutterstockCategories) : '""'}\n`;
    }

    return csv;
  },

  /**
   * iStock CSV format: Filename, Title, Description, Keywords, Editorial, Artist Name
   */
  istock: (data, helpers, config) => {
    const { processFilename, cleanValue, formatKeywords } = helpers;
    const { editorial = false, artistName = "" } = config;
    let csv = "Filename,Title,Description,Keywords,Editorial,Artist Name\n";

    for (const item of data) {
      csv +=
        `${cleanValue(processFilename(item.filename))},` +
        `${cleanValue(item.title)},` +
        `${cleanValue(item.description)},` +
        `${formatKeywords(item.keywords)},` +
        `${editorial ? "Yes" : "No"},` +
        `${cleanValue(artistName)}\n`;
    }

    return csv;
  },

  /**
   * Pond5 CSV format: Filename, Title, Description, Keywords, Editorial
   */
  pond5: (data, helpers, config) => {
    const { processFilename, cleanValue, formatKeywords } = helpers;
    const { editorial = false } = config;
    let csv = "Filename,Title,Description,Keywords,Editorial\n";

    for (const item of data) {
      csv +=
        `${cleanValue(processFilename(item.filename))},` +
        `${cleanValue(item.title)},` +
        `${cleanValue(item.description)},` +
        `${formatKeywords(item.keywords)},` +
        `${editorial ? "Yes" : "No"}\n`;
    }

    return csv;
  },

  /**
   * 123RF CSV format: oldfilename, 123rf_filename, description, keywords, Country
   */
  "123rf": (data, helpers, config) => {
    const { processFilename, cleanValue, formatKeywords } = helpers;
    const { country = "US" } = config;
    let csv = "oldfilename,123rf_filename,description,keywords,Country\n";

    for (const item of data) {
      csv +=
        `${cleanValue(processFilename(item.filename))},` +
        `${cleanValue(`${country} ${item.title}`)},` +
        `${cleanValue(item.description)},` +
        `${formatKeywords(item.keywords)},` +
        `${cleanValue(country)}\n`;
    }

    return csv;
  },

  /**
   * Dreamstime CSV format: filename, title, description, keywords
   */
  dreamstime: (data, helpers) => {
    const { processFilename, cleanValue, formatKeywords } = helpers;
    let csv = "filename,title,description,keywords\n";

    for (const item of data) {
      csv +=
        `${cleanValue(processFilename(item.filename))},` +
        `${cleanValue(item.title)},` +
        `${cleanValue(item.description)},` +
        `${formatKeywords(item.keywords)}\n`;
    }

    return csv;
  },

  /**
   * Vecteezy CSV format: Filename, Title, Description, Keywords
   */
  vecteezy: (data, helpers) => {
    const cleanValue = (value) => {
      if (!value) return '""';
      const cleaned = String(value)
        .replace(/\r?\n/g, " ")
        .replace(/"/g, '""');
      return cleaned.includes(",") ? `"${cleaned}"` : cleaned;
    };

    const formatKeywords = (keywords) => {
      if (!keywords) return '""';
      if (Array.isArray(keywords)) {
        const joined = keywords
          .join(", ")
          .replace(/\r?\n/g, " ")
          .replace(/"/g, '""');
        return `"${joined}"`;
      }
      const cleaned = String(keywords)
        .replace(/\r?\n/g, " ")
        .replace(/"/g, '""');
      return cleaned.includes(",") ? `"${cleaned}"` : cleaned;
    };

    let csv = "Filename,Title,Description,Keywords\n";

    for (const item of data) {
      csv +=
        `${cleanValue(processFilename(item.filename))},` +
        `${cleanValue(item.title)},` +
        `${cleanValue(item.description)},` +
        `${formatKeywords(item.keywords)}\n`;
    }

    return csv;
  },
};

/**
 * Checks if a market configuration is enabled.
 *
 * @param {*} market - Market configuration value.
 * @returns {boolean} True if the market is enabled.
 */
const isMarketEnabled = (market) => {
  if (!market) return false;
  if (market === true) return true;
  if (typeof market === "object" && !("enabled" in market)) return true;
  return market.enabled === true;
};

/** @type {string[]} All supported market identifiers. */
const MARKETS = [
  "general",
  "adobestock",
  "freepik",
  "shutterstock",
  "istock",
  "pond5",
  "123rf",
  "dreamstime",
  "vecteezy",
];

module.exports = {
  createHelpers,
  CSV_GENERATORS,
  isMarketEnabled,
  MARKETS,
};
