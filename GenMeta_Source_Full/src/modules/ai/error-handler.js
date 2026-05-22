const getGeminiErrorMessage = require("./error-messages");

/**
 * Execute a Gemini API call with standardized error handling
 * @param {Function} apiCall - Async function that makes the API call
 * @returns {Promise<*>} API response
 * @throws {Error} User-friendly error message on failure
 */
async function executeGeminiApiCall(apiCall) {
  try {
    return await apiCall();
  } catch (error) {
    throw new Error(getGeminiErrorMessage(error));
  }
}

module.exports = { getGeminiErrorMessage, executeGeminiApiCall };
