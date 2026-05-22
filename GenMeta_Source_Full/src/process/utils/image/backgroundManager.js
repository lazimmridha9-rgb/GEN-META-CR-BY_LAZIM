const fs = require("fs");
const path = require("path");
const os = require("os");
const https = require("https");
const crypto = require("crypto");

let backgroundImagePromise = null;
let backgroundImagePath = null;

/**
 * Downloads a background image from a URL and caches it locally.
 * Returns the cached path if the file already exists.
 *
 * @param {string} imageUrl - URL of the image to download.
 * @param {string|null} [customLocalDir=null] - Custom directory for the cached file.
 * @param {string|null} [customFileName=null] - Custom filename for the cached file.
 * @returns {Promise<string>} Path to the local cached image.
 */
async function downloadBackgroundImage(
  imageUrl,
  customLocalDir = null,
  customFileName = null
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

  // Return cached file if it already exists
  if (fs.existsSync(localFilePath)) {
    return localFilePath;
  }

  // Download the image
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(localFilePath);

    https.get(imageUrl, (response) => {
      if (response.statusCode !== 200) {
        reject(
          new Error(`Failed to download image: ${response.statusCode}`)
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
        new Error(`Error downloading background image: ${err.message}`)
      );
    });
  });
}

/**
 * Gets the background image path, downloading it if necessary.
 * Uses a cached promise to prevent concurrent downloads.
 *
 * @param {string} [imageUrl] - URL of the background image.
 * @param {string|null} [customLocalDir=null] - Custom cache directory.
 * @param {string|null} [customFileName=null] - Custom filename.
 * @returns {Promise<string>} Path to the background image.
 */
async function getBackgroundImage(
  imageUrl = "https://gen-meta-optimized.s3.ap-south-1.amazonaws.com/Assets/background.jpg",
  customLocalDir = null,
  customFileName = null
) {
  if (backgroundImagePath) return backgroundImagePath;
  if (backgroundImagePromise) return backgroundImagePromise;

  backgroundImagePromise = downloadBackgroundImage(
    imageUrl,
    customLocalDir,
    customFileName
  );
  backgroundImagePath = await backgroundImagePromise;
  return backgroundImagePath;
}

/**
 * Preloads the background image by initiating the download early.
 *
 * @param {string} [imageUrl] - URL of the background image.
 * @returns {Promise<string>} Path to the background image.
 */
async function preloadBackgroundImage(
  imageUrl = "https://res.cloudinary.com/dgiwjljvf/image/upload/v1778131750/background_j0njg8.jpg"
) {
  return getBackgroundImage(imageUrl);
}

module.exports = { downloadBackgroundImage, getBackgroundImage, preloadBackgroundImage };
