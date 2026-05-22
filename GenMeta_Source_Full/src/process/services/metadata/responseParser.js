const { extractJsonStructure } = require("../../../shared/helpers/jsonHelpers");
const { ensureMetadataArray } = require("../../ai/prompt/index");
const { validateMetadata } = require("../../validateMetadata");
const CONSTANTS = require("../../../config/constant");
const { getFilename, getBaseName } = require("./formatHelper");

/**
 * Parses and validates the Gemini API JSON response into a metadata array.
 *
 * @param {string} jsonResponse - Raw JSON response from Gemini.
 * @param {Array<Object>} preparedMedia - Prepared media items for count validation.
 * @param {number} retryCount - Current retry attempt number.
 * @param {Object} options - Processing options (e.g., addPeriodTitle).
 * @returns {Promise<Array<Object>|null>} Validated metadata array, or null on recoverable failure.
 * @throws {Error} On unrecoverable parse/validation errors.
 */
async function parseAndValidateResponse(
  jsonResponse,
  preparedMedia,
  retryCount,
  options
) {
  try {
    // Strip markdown code fences if present
    let cleanedResponse = jsonResponse
      .replace(/^```json\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    let parsedMetadata;
    try {
      parsedMetadata = JSON.parse(cleanedResponse);
    } catch (parseError) {
      // Attempt to repair the JSON string
      cleanedResponse = cleanJsonString(cleanedResponse, parseError);
      parsedMetadata = JSON.parse(cleanedResponse);
    }

    let metadataArray = ensureMetadataArray(parsedMetadata);

    // Check if we got enough metadata items
    if (metadataArray.length < preparedMedia.length) {
      if (retryCount === CONSTANTS.MAX_RETRIES) {
        // Fill missing items with placeholders on the last retry
        metadataArray = fillMissingMetadata(metadataArray, preparedMedia);
      } else {
        throw new Error(
          `Incomplete metadata: expected ${preparedMedia.length} items, got ${metadataArray.length}`
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

    // Optionally append periods to title and description
    if (
      options.addPeriodTitle !== false ||
      options.addPeriodDescription !== false
    ) {
      metadataArray = metadataArray.map((item) =>
        addPeriodToMetadata(item, options)
      );
    }

    return metadataArray;
  } catch (parseError) {
    if (retryCount === CONSTANTS.MAX_RETRIES) {
      throw new Error(
        `Failed to parse or validate Gemini response: ${parseError.message}`
      );
    }
    return null; // Recoverable: caller will retry
  }
}

/**
 * Cleans a malformed JSON string by finding the end of the first complete
 * JSON structure (balanced brackets/braces).
 *
 * @param {string} text - The potentially malformed JSON string.
 * @param {Error} originalError - The original parse error to re-throw if cleaning fails.
 * @returns {string} The cleaned JSON substring.
 * @throws {Error} The original error if no valid JSON boundary is found.
 */
function cleanJsonString(text, originalError) {
  let jsonEndIndex = -1;
  let bracketCount = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

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
    return text.substring(0, jsonEndIndex).trim();
  }

  throw originalError;
}

/**
 * Appends periods to the title and description if they don't already end with one.
 *
 * @param {Object} metadata - Metadata object.
 * @param {Object} options - Processing options.
 * @returns {Object} Modified metadata object.
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
 * Fills in missing metadata entries with placeholder values based on the
 * original media filenames.
 *
 * @param {Array<Object>} metadataArray - Existing metadata items.
 * @param {Array<Object>} preparedMedia - Prepared media items.
 * @returns {Array<Object>} Metadata array with placeholders for missing items.
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

module.exports = { parseAndValidateResponse, cleanJsonString };
