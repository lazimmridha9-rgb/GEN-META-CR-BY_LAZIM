/**
 * Attempts to repair a malformed JSON string by applying common fixes.
 *
 * @param {string} jsonString - The potentially malformed JSON string.
 * @returns {string} The repaired JSON string (may still be invalid if unfixable).
 */
function repairJson(jsonString) {
  if (!jsonString) return "";

  try {
    // First, try parsing as-is
    JSON.parse(jsonString);
    return jsonString; // Already valid
  } catch (error) {
    let repairedJson = jsonString;

    // Use error position to locate the issue
    const positionMatch = error.message.match(/position (\d+)/);
    const errorPosition = positionMatch ? parseInt(positionMatch[1]) : -1;

    if (errorPosition > 0) {
      console.error(`Error detected near position ${errorPosition}`);

      // Extract context around the error (20 chars before and after)
      const start = Math.max(0, errorPosition - 20);
      const end = Math.min(jsonString.length, errorPosition + 20);
      const context = jsonString.substring(start, end);
      console.error(`Context around error: "${context}"`);
    }

    // Fix dangling commas in objects
    repairedJson = repairedJson.replace(/,\s*}/g, "}");

    // Fix dangling commas in arrays
    repairedJson = repairedJson.replace(/,\s*\]/g, "]");

    // Add missing quotes around property names
    repairedJson = repairedJson.replace(
      /({|,)\s*([a-zA-Z0-9_]+)\s*:/g,
      '$1"$2":'
    );

    // Fix missing commas between properties
    repairedJson = repairedJson.replace(/"\s*}\s*{\s*"/g, '"},{"');
    repairedJson = repairedJson.replace(/"\s*}\s*"/g, '"},"');

    // Fix unescaped quotes within string values
    repairedJson = repairedJson.replace(/(:\s*".*?)(?<!\\)"(.*?")/g, '$1\\"$2');

    // Fix incomplete arrays or objects by adding missing closing brackets
    if (repairedJson.split("{").length > repairedJson.split("}").length) {
      repairedJson += "}";
    }
    if (repairedJson.split("[").length > repairedJson.split("]").length) {
      repairedJson += "]";
    }

    // Wrap in array brackets if it looks like an array of metadata objects
    if (!repairedJson.startsWith("[") && repairedJson.includes('{"title":')) {
      repairedJson = "[" + repairedJson + "]";
    }

    return repairedJson;
  }
}

module.exports = { repairJson };
