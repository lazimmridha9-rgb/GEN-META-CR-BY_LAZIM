/**
 * Validate metadata quality against microstock standards
 * @param {object} metadata - Metadata object to validate
 * @param {string} originalFilename - Original filename for comparison
 * @returns {boolean} True if metadata passes validation
 */
const validateMetadata = (metadata, originalFilename) => {
  // Check basic structure
  if (!metadata || typeof metadata !== "object") return false;

  // Validate title
  if (
    !metadata.title ||
    metadata.title.startsWith("Image ") ||
    metadata.title === originalFilename ||
    metadata.title.length < 20 ||
    metadata.title.includes("image_") ||
    metadata.title.includes("filename")
  ) {
    console.warn(`Invalid title: "${metadata.title}"`);
    return false;
  }

  // Validate description
  if (
    !metadata.description ||
    metadata.description.startsWith("Uploaded image file") ||
    metadata.description.length < 40 ||
    metadata.description.includes("image file") ||
    metadata.description.includes("upload")
  ) {
    console.warn(
      `Invalid description: "${metadata.description?.substring(0, 40)}..."`,
    );
    return false;
  }

  // Validate keywords
  if (
    !Array.isArray(metadata.keywords) ||
    metadata.keywords.length < 10 ||
    (metadata.keywords.length <= 5 &&
      (metadata.keywords.includes("image") ||
        metadata.keywords.includes("upload") ||
        metadata.keywords.includes("photo")))
  ) {
    console.warn(
      `Invalid keywords: ${metadata.keywords ? JSON.stringify(metadata.keywords) : "none"}`,
    );
    return false;
  }

  return true;
};

module.exports = { validateMetadata };
