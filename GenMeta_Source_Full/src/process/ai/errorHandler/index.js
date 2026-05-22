const getGeminiErrorMessage = require("./errorMessages");

/**
 * Executes a Gemini API call with centralized error handling.
 * Translates raw API errors into user-friendly messages.
 *
 * @param {Function} apiCall - Async function that performs the API call.
 * @returns {Promise<*>} The API response.
 * @throws {Error} A user-friendly error message on failure.
 */
async function executeGeminiApiCall(apiCall) {
  try {
    return await apiCall();
  } catch (error) {
    throw new Error(getGeminiErrorMessage(error));
  }
}

module.exports = { getGeminiErrorMessage, executeGeminiApiCall };
