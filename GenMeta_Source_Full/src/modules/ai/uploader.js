const fs = require("fs");

/**
 * Upload a file to Gemini by reading it as base64 inline data
 * @param {string} filePath - Path to the file to upload
 * @param {string} mimeType - MIME type of the file
 * @returns {{ inlineData: { data: string, mimeType: string } }} Inline data part for Gemini API
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
