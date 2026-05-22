const { extractJsonStructure } = require("../../shared/helpers/jsonHelpers");
const { ensureMetadataArray } = require("../ai/prompt");
const { validateMetadata } = require("./validator");
const CONSTANTS = require("../../config/constants");
const { getBaseName, getFilename } = require("./format");

/**
 * Parse and validate a Gemini API response into metadata objects
 * @param {string} jsonResponse - Raw JSON response from Gemini
 * @param {object[]} preparedMedia - Prepared media items
 * @param {number} retryCount - Current retry attempt
 * @param {object} options - Processing options
 * @returns {Promise<object[]|null>} Array of metadata objects or null on recoverable error
 */
async function parseAndValidateResponse(
  jsonResponse,
  preparedMedia,
  retryCount,
  options,
) {
  try {
    let cleanedResponse = jsonResponse
      .replace(/^```json\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    let parsedMetadata;
    try {
      parsedMetadata = JSON.parse(cleanedResponse);
    } catch (parseError) {
      cleanedResponse = cleanJsonString(cleanedResponse, parseError);
      parsedMetadata = JSON.parse(cleanedResponse);
    }

    let metadataArray = ensureMetadataArray(parsedMetadata);

    // Check if we have enough metadata items
    if (metadataArray.length < preparedMedia.length) {
      if (retryCount === CONSTANTS.MAX_RETRIES) {
        metadataArray = fillMissingMetadata(metadataArray, preparedMedia);
      } else {
        throw new Error(
          `Incomplete metadata: expected ${preparedMedia.length} items, got ${metadataArray.length}`,
        );
      }
    }

    // Validate each metadata item
    metadataArray.forEach((meta, idx) => {
      const filename = getFilename(preparedMedia[idx], idx);
      if (!validateMetadata(meta, filename)) {
        throw new Error(`Invalid metadata format for media ${idx}`);
      }
    });

    // Add periods to title/description if enabled
    if (
      options.addPeriodTitle !== false ||
      options.addPeriodDescription !== false
    ) {
      metadataArray = metadataArray.map((item) =>
        addPeriodToMetadata(item, options),
      );
    }

    return metadataArray;
  } catch (parseError) {
    if (retryCount === CONSTANTS.MAX_RETRIES) {
      throw new Error(
        `Failed to parse or validate Gemini response: ${parseError.message}`,
      );
    }
    return null; // Recoverable error - caller will retry
  }
}

/**
 * Clean a malformed JSON string by finding the proper closing bracket
 * @param {string} text - Raw JSON text
 * @param {Error} originalError - Original parse error
 * @returns {string} Cleaned JSON string
 * @throws {Error} Original error if cleanup fails
 */
function cleanJsonString(text, originalError) {
  let cleaned = text;
  let jsonEndIndex = -1;
  let bracketCount = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    if (ch === "\\") {
      escapeNext = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (ch === "[" || ch === "{") {
        bracketCount++;
      } else if (ch === "]" || ch === "}") {
        bracketCount--;
        if (bracketCount === 0) {
          jsonEndIndex = i + 1;
          break;
        }
      }
    }
  }

  if (jsonEndIndex > 0) {
    return cleaned.substring(0, jsonEndIndex).trim();
  }

  throw originalError;
}

/**
 * Add trailing periods to title and description if enabled
 * @param {object} metadata - Metadata object
 * @param {object} options - Processing options
 * @returns {object} Updated metadata
 */
function addPeriodToMetadata(metadata, options) {
  if (
    options.addPeriodTitle !== false &&
    metadata.title &&
    typeof metadata.title === "string"
  ) {
    const trimmed = metadata.title.trim();
    if (trimmed && !trimmed.endsWith(".")) {
      metadata.title = trimmed + ".";
    }
  }

  if (
    options.addPeriodDescription !== false &&
    metadata.description &&
    typeof metadata.description === "string"
  ) {
    const trimmed = metadata.description.trim();
    if (trimmed && !trimmed.endsWith(".")) {
      metadata.description = trimmed + ".";
    }
  }

  return metadata;
}

/**
 * Fill missing metadata items with placeholder data
 * @param {object[]} metadataArray - Existing metadata items
 * @param {object[]} preparedMedia - Prepared media items
 * @returns {object[]} Completed metadata array
 */
function fillMissingMetadata(metadataArray, preparedMedia) {
  while (metadataArray.length < preparedMedia.length) {
    const missingIdx = metadataArray.length;
    const originalMedia = preparedMedia[missingIdx].originalMedia;
    const baseName = getBaseName(originalMedia);
    const isVideo = preparedMedia[missingIdx].mediaType === "video";

    metadataArray.push({
      title: `Professional ${isVideo ? "video" : "image"} of ${baseName}`,
      description: `High quality detailed ${isVideo ? "video" : "image"} showing ${baseName} with professional composition${isVideo ? " and cinematography" : " and lighting"}. Perfect for commercial use and ${isVideo ? "multimedia" : "design"} projects.`,
      keywords: [
        "professional",
        "high quality",
        "detailed",
        "commercial use",
        isVideo ? "video" : "photography",
        isVideo ? "multimedia" : "digital image",
        isVideo ? "motion graphics" : "stock photo",
        baseName,
      ],
      _generated: "placeholder_from_incomplete_response",
    });
  }

  return metadataArray;
}

module.exports = { cleanJsonString, parseAndValidateResponse };
