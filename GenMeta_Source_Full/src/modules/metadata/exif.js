/**
 * Normalize metadata from various input formats
 * @param {object} metadata - Raw metadata object
 * @returns {{ title: string, description: string, keywords: object[] }}
 */
function normalizeMetadata(metadata) {
  return {
    title: metadata.title || metadata.Title || "",
    description: metadata.description || metadata.Description || "",
    keywords: metadata.keywords || [],
  };
}

/**
 * Prepare metadata tags for specific file formats
 * @param {object} metadata - Metadata to prepare
 * @param {string} format - File extension (e.g., '.jpg', '.png', '.mp4')
 * @returns {object} Format-specific metadata tags
 */
function prepareMetadata(metadata, format) {
  const { title, description, keywords } = normalizeMetadata(metadata);

  const commonXMP = {
    "XMP:Title": title,
    "XMP:Description": description,
    "XMP:Subject": keywords,
  };

  switch (format) {
    case ".jpg":
    case ".jpeg":
      return {
        ...commonXMP,
        "IPTC:ObjectName": title,
        "IPTC:Caption-Abstract": description,
        "IPTC:Keywords": keywords,
        "EXIF:ImageDescription": description,
        "EXIF:XPTitle": title,
        "EXIF:XPKeywords": keywords?.join(";"),
        "XMP:Rating": 5,
        "EXIF:Rating": 5,
      };

    case ".png":
      return {
        ...commonXMP,
        "PNG:Title": title,
        "PNG:Description": description,
        Description: description,
        "XMP:Rating": 5,
      };

    case ".mp4":
    case ".mov":
      return {
        Title: title,
        Description: description,
        Keywords: keywords?.join(","),
        Subject: keywords?.join(","),
      };

    default:
      return {
        Title: title,
        Description: description,
        Keywords: keywords,
      };
  }
}

module.exports = { normalizeMetadata, prepareMetadata };
