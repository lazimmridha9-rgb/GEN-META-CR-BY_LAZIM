const path = require("path");

const CONSTANTS = require("../../../config/constants");

/**
 * Group media files by format and split into batches
 * @param {object[]} mediaFiles - Array of file objects with path property
 * @param {object} [batchSizes] - Optional per-format batch sizes
 * @returns {object[][]} Array of batches
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

  // Sort files into format groups
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

  // Helper to split a group into batches
  const createBatches = (group, batchSize) => {
    for (let i = 0; i < group.length; i += batchSize) {
      batches.push(group.slice(i, i + batchSize));
    }
  };

  // Process each group
  Object.entries(groups).forEach(([groupName, items]) => {
    if (items.length > 0) {
      createBatches(items, batchSizes[groupName] || IMAGE_BATCH_SIZE);
    }
  });

  return batches;
}

/**
 * Legacy function for backward compatibility - batch images only
 * @param {object[]} images - Array of image file objects
 * @param {number} [batchSize=5] - Batch size for images
 * @returns {object[][]} Array of batches
 */
function batchImages(images, batchSize = IMAGE_BATCH_SIZE) {
  return batchFiles(images, { ...DEFAULT_BATCH_SIZES, jpg: batchSize });
}

// Format group definitions
const FORMAT_GROUPS = {
  jpg: [".jpg", ".jpeg"],
  png: [".png"],
  eps: [".eps"],
  svg: [".svg"],
  video: [".mp4", ".mov"],
};

// Default batch sizes
const IMAGE_BATCH_SIZE = 5;
const VIDEO_BATCH_SIZE = 1;

const DEFAULT_BATCH_SIZES = {
  jpg: IMAGE_BATCH_SIZE,
  png: IMAGE_BATCH_SIZE,
  eps: IMAGE_BATCH_SIZE,
  svg: IMAGE_BATCH_SIZE,
  video: VIDEO_BATCH_SIZE,
  other: IMAGE_BATCH_SIZE,
};

module.exports = {
  batchFiles,
  batchImages,
  IMAGE_BATCH_SIZE,
  VIDEO_BATCH_SIZE,
};
