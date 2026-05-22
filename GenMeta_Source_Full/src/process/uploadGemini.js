const fs = require("fs");

/**
 * Uploads a file to Gemini by reading it as base64 and returning
 * the inline data format expected by the Gemini API.
 *
 * @param {string} filePath - Path to the file to upload.
 * @param {string} mimeType - MIME type of the file.
 * @returns {Promise<{inlineData: {data: string, mimeType: string}}>} The inline data payload.
 */
async function uploadToGemini(filePath, mimeType) {
  const fileBuffer = fs.readFileSync(filePath);
  const base64Data = fileBuffer.toString("base64");

  return {
    inlineData: {
      data: base64Data,
      mimeType: mimeType,
    },
  };
}

module.exports = { uploadToGemini };
