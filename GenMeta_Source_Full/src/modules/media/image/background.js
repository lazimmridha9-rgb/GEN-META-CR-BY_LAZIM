const fs = require("fs");
const path = require("path");
const os = require("os");
const https = require("https");
const crypto = require("crypto");

let backgroundImagePromise = null;
let backgroundImagePath = null;

/**
 * Download a background image from a URL with caching
 * @param {string} imageUrl - URL of the background image
 * @param {string|null} [customLocalDir=null] - Custom directory for storage
 * @param {string|null} [customFileName=null] - Custom filename
 * @returns {Promise<string>} Local file path
 */
async function downloadBackgroundImage(
  imageUrl,
  customLocalDir = null,
  customFileName = null,
) {
  const urlHash = crypto.createHash("md5").update(imageUrl).digest("hex");
  const urlObj = new URL(imageUrl);
  const fileExtension = path.extname(urlObj.pathname) || ".jpg";

  const localDir =
    customLocalDir ||
    path.join(os.homedir(), "AppData", "Local", "GenMeta", "backgrounds");

  if (!fs.existsSync(localDir)) {
    await fs.promises.mkdir(localDir, { recursive: true });
  }

  const fileName = customFileName || `background_${urlHash}${fileExtension}`;
  const localFilePath = path.join(localDir, fileName);

  // Return cached path if already downloaded
  if (fs.existsSync(localFilePath)) return localFilePath;

  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(localFilePath);

    https.get(imageUrl, (response) => {
      if (response.statusCode !== 200) {
        reject(
          new Error(`Failed to download image: ${response.statusCode}`),
        );
        return;
      }
      response.pipe(file);
      file.on("finish", () => {
        file.close();
        resolve(localFilePath);
      });
    }).on("error", (err) => {
      fs.unlink(localFilePath, () => {});
      reject(
        new Error(`Error downloading background image: ${err.message}`),
      );
    });
  });
}

/**
 * Get background image path, downloading if necessary (with deduplication)
 * @param {string} [imageUrl] - Default background image URL
 * @param {string|null} [customLocalDir] - Custom storage directory
 * @param {string|null} [customFileName] - Custom filename
 * @returns {Promise<string>} Local file path
 */
async function getBackgroundImage(
  imageUrl = "https://gen-meta-optimized.s3.ap-south-1.amazonaws.com/Assets/background.jpg",
  customLocalDir = null,
  customFileName = null,
) {
  if (backgroundImagePath) return backgroundImagePath;
  if (backgroundImagePromise) return await backgroundImagePromise;

  backgroundImagePromise = downloadBackgroundImage(
    imageUrl,
    customLocalDir,
    customFileName,
  );
  backgroundImagePath = await backgroundImagePromise;
  return backgroundImagePath;
}

/**
 * Preload the background image for later use
 * @param {string} [imageUrl] - Background image URL
 * @returns {Promise<string>} Local file path
 */
async function preloadBackgroundImage(
  imageUrl = "https://res.cloudinary.com/dgiwjljvf/image/upload/v1778131750/background_j0njg8.jpg",
) {
  return await getBackgroundImage(imageUrl);
}

module.exports = {
  downloadBackgroundImage,
  getBackgroundImage,
  preloadBackgroundImage,
};
