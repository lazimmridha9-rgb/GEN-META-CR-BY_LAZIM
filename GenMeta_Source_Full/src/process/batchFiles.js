const path = require("path");

// Default batch sizes per media type
const IMAGE_BATCH_SIZE = 5;
const VIDEO_BATCH_SIZE = 1;

// Supported media format groups for easy extension
const FORMAT_GROUPS = {
  jpg: [".jpg", ".jpeg"],
  png: [".png"],
  eps: [".eps"],
  svg: [".svg"],
  video: [".mp4", ".mov"],
};

// Default batch sizes mapped to format groups
const DEFAULT_BATCH_SIZES = {
  jpg: IMAGE_BATCH_SIZE,
  png: IMAGE_BATCH_SIZE,
  eps: IMAGE_BATCH_SIZE,
  svg: IMAGE_BATCH_SIZE,
  video: VIDEO_BATCH_SIZE,
  other: IMAGE_BATCH_SIZE,
};

/**
 * Groups files by type and format, creating batches for each group.
 *
 * @param {Array<Object>} mediaFiles - Array of file objects with a `path` property.
 * @param {Object} [batchSizes=DEFAULT_BATCH_SIZES] - Optional per-format batch sizes.
 * @returns {Array<Array<Object>>} Array of batches, each containing file objects.
 */
function batchFiles(mediaFiles, batchSizes = DEFAULT_BATCH_SIZES) {
  const groups = {
    jpg: [],
    png: [],
    eps: [],
    svg: [],
    video: [],
    other: [],
  };

  // Sort files into type groups based on extension
  mediaFiles.forEach((media) => {
    const ext = path.extname(media.path || "").toLowerCase();

    if (FORMAT_GROUPS.jpg.includes(ext)) groups.jpg.push(media);
    else if (FORMAT_GROUPS.png.includes(ext)) groups.png.push(media);
    else if (FORMAT_GROUPS.eps.includes(ext)) groups.eps.push(media);
    else if (FORMAT_GROUPS.svg.includes(ext)) groups.svg.push(media);
    else if (FORMAT_GROUPS.video.includes(ext)) groups.video.push(media);
    else groups.other.push(media);
  });

  const batches = [];

  /**
   * Splits a group of items into chunks of the specified batch size.
   *
   * @param {Array} group - The items to batch.
   * @param {number} batchSize - The maximum size of each batch.
   */
  const createBatches = (group, batchSize) => {
    for (let i = 0; i < group.length; i += batchSize) {
      batches.push(group.slice(i, i + batchSize));
    }
  };

  // Process each group with its configured batch size
  Object.entries(groups).forEach(([groupName, items]) => {
    if (items.length > 0) {
      createBatches(items, batchSizes[groupName] || IMAGE_BATCH_SIZE);
    }
  });

  return batches;
}

/**
 * Legacy helper for batching images only (backward compatibility).
 *
 * @param {Array<Object>} images - Array of image file objects.
 * @param {number} [batchSize=IMAGE_BATCH_SIZE] - The batch size for JPG files.
 * @returns {Array<Array<Object>>} Array of batches.
 */
function batchImages(images, batchSize = IMAGE_BATCH_SIZE) {
  return batchFiles(images, { ...DEFAULT_BATCH_SIZES, jpg: batchSize });
}

module.exports = {
  batchFiles,
  batchImages,
  IMAGE_BATCH_SIZE,
  VIDEO_BATCH_SIZE,
};
