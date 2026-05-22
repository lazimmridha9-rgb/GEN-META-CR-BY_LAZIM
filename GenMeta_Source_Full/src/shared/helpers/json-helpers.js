/**
 * Extracts and parses JSON from text that may contain markdown code fences.
 * Falls back to manual bracket matching if initial parse fails.
 *
 * @param {string} text - The text containing JSON, possibly wrapped in ```json fences.
 * @returns {Object|Array} The parsed JSON object or array.
 * @throws {Error} If no valid JSON can be extracted.
 */
function extractJsonStructure(text) {
  // Remove markdown JSON code fences if present
  let cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  // Try direct parsing first
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Fall through to manual extraction
  }

  // Manually find JSON boundaries by tracking bracket depth
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
    return JSON.parse(cleaned.substring(0, jsonEndIndex).trim());
  }

  throw new Error("Could not extract valid JSON");
}

/**
 * Extracts text content from a Gemini API response object.
 *
 * @param {Object} response - The Gemini API response object.
 * @returns {string} The combined text from all response parts.
 * @throws {Error} If the response is invalid or contains no text.
 */
function extractTextFromResponse(response) {
  if (!response || !response.candidates || response.candidates.length === 0) {
    throw new Error("No response candidates from Gemini API");
  }

  const candidate = response.candidates[0];

  if (!candidate.content || !candidate.content.parts) {
    throw new Error("No content parts in Gemini API response");
  }

  // Filter and extract text parts
  const textParts = candidate.content.parts
    .filter((p) => p.text !== undefined && p.text !== null)
    .map((p) => p.text);

  if (textParts.length === 0) {
    throw new Error("No text content in Gemini API response");
  }

  return textParts.join("");
}

module.exports = { extractJsonStructure, extractTextFromResponse };
