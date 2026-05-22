/**
 * Convert Gemini API errors to user-friendly messages
 * @param {Error} error - The original error object
 * @returns {string} User-friendly error message
 */
function getGeminiErrorMessage(error) {
  const msg = error.message || error.toString();

  if (msg.includes("quota exceeded") || msg.includes("RESOURCE_EXHAUSTED"))
    return "API quota exceeded. Please try again later.";

  if (msg.includes("overloaded") || msg.includes("UNAVAILABLE"))
    return "Gemini model is currently overloaded. Please try again in a few moments.";

  if (msg.includes("safety") || msg.includes("SAFETY"))
    return "Content blocked by safety filters. Please try with different content.";

  if (msg.includes("image") || msg.includes("format"))
    return "Invalid image format. Please ensure your image is in a supported format (JPEG, PNG, WebP).";

  if (msg.includes("size") || msg.includes("large"))
    return "File size too large. Please reduce image size and try again.";

  if (
    msg.includes("API key") ||
    msg.includes("401") ||
    msg.includes("Unauthorized")
  )
    return "Invalid API key. Please check your Gemini API key.";

  if (msg.includes("403") || msg.includes("Forbidden")) {
    if (msg.includes("billing"))
      return "Billing required. Please enable billing for your Google Cloud project.";
    return "API access forbidden. Please verify your API key permissions.";
  }

  if (msg.includes("429") || msg.includes("rate limit")) {
    if (msg.includes("quota"))
      return "Daily quota exceeded. Please wait until tomorrow or change your API key.";
    return "Rate limit exceeded. Please wait a moment and try again or change your API key.";
  }

  if (msg.includes("500") || msg.includes("Internal Server Error"))
    return "Gemini API server error. Please try again later.";
  if (msg.includes("502") || msg.includes("Bad Gateway"))
    return "Bad gateway. Gemini API is temporarily unavailable.";
  if (msg.includes("503") || msg.includes("Service Unavailable"))
    return "Service unavailable. Gemini API is temporarily down for maintenance.";
  if (msg.includes("504") || msg.includes("Gateway Timeout"))
    return "Request timeout. Please try again with a smaller image or simpler request.";

  if (
    msg.includes("network") ||
    msg.includes("fetch") ||
    msg.includes("ECONNREFUSED") ||
    msg.includes("ENOTFOUND")
  )
    return "Network error. Please check your internet connection and try again.";

  if (msg.includes("timeout"))
    return "Request timeout. Please try again with a smaller image or simpler request.";
  if (msg.includes("generativelanguage.googleapis.com"))
    return "API connection error. Please check your internet connection.";
  if (msg.length > 200) return "API error occurred. Please try again later.";

  return msg || "Unknown API error. Please try again.";
}

module.exports = getGeminiErrorMessage;
