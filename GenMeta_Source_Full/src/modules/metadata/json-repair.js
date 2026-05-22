/**
 * Attempt to repair malformed JSON strings from AI responses
 * @param {string} jsonString - Potentially malformed JSON
 * @returns {string} Repaired JSON string (may still be invalid)
 */
function repairJson(jsonString) {
  if (!jsonString) return "";

  try {
    // Try parsing as-is first
    JSON.parse(jsonString);
    return jsonString;
  } catch (error) {
    let repairedJson = jsonString;

    // Use error position for debugging context
    const positionMatch = error.message.match(/position (\d+)/);
    const errorPosition = positionMatch ? parseInt(positionMatch[1]) : -1;

    if (errorPosition > 0) {
      console.error(`Error detected near position ${errorPosition}`);
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
      '$1"$2":',
    );

    // Fix missing commas between properties
    repairedJson = repairedJson.replace(/"\s*}\s*{\s*"/g, '"},{"');
    repairedJson = repairedJson.replace(/"\s*}\s*"/g, '"},"');

    // Fix unescaped quotes in strings
    repairedJson = repairedJson.replace(
      /(:\s*".*?)(?<!\\)"(.*?")/g,
      '$1\\"$2',
    );

    // Fix incomplete arrays or objects
    if (
      repairedJson.split("{").length > repairedJson.split("}").length
    ) {
      repairedJson += "}";
    }
    if (
      repairedJson.split("[").length > repairedJson.split("]").length
    ) {
      repairedJson += "]";
    }

    // Wrap in array brackets if it looks like an array of objects
    if (
      !repairedJson.startsWith("[") &&
      repairedJson.includes('{"title":')
    ) {
      repairedJson = "[" + repairedJson + "]";
    }

    return repairedJson;
  }
}

module.exports = { repairJson };
