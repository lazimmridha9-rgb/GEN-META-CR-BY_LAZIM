const fs = require("fs");
const path = require("path");
const os = require("os");
const sharp = require("sharp");

const { getBackgroundImage } = require("./backgroundManager");

/**
 * Resizes an image buffer and saves it to the specified output path.
 * For PNG output, optionally composites the image over a background.
 *
 * @param {Buffer} imageBuffer - The image buffer to resize.
 * @param {string} outputPath - Destination file path.
 * @param {Object} [options={}] - Resize options (width, quality, withoutEnlargement, format, backgroundPath).
 * @returns {Promise<string>} The output file path.
 */
async function resizeImage(imageBuffer, outputPath, options = {}) {
  const {
    width = 1080,
    quality = 100,
    withoutEnlargement = true,
    format = null,
    backgroundPath = null,
  } = options;

  const targetFormat =
    format || path.extname(outputPath).toLowerCase().substring(1);
  const outputDir = path.dirname(outputPath);

  if (!fs.existsSync(outputDir)) {
    await fs.promises.mkdir(outputDir, { recursive: true });
  }

  // Resolve background image for PNG output
  let resolvedBgPath = null;
  if (targetFormat === "png") {
    try {
      resolvedBgPath =
        backgroundPath && typeof backgroundPath === "string"
          ? path.isAbsolute(backgroundPath)
            ? backgroundPath
            : path.resolve(__dirname, backgroundPath)
          : await getBackgroundImage();
    } catch (error) {
      resolvedBgPath = path.join(
        os.homedir(),
        "AppData",
        "Local",
        "GenMeta",
        "backgrounds",
        "background.jpg"
      );
    }
  }

  let sharpInstance = sharp(imageBuffer).resize({
    width,
    withoutEnlargement,
  });

  // Handle format-specific output
  switch (targetFormat) {
    case "jpg":
    case "jpeg":
      sharpInstance = sharpInstance.jpeg({ quality });
      break;

    case "png":
      if (resolvedBgPath && fs.existsSync(resolvedBgPath)) {
        // Composite resized image over background
        const resizedBuffer = await sharpInstance
          .png({ quality: Math.round(quality), compressionLevel: 6 })
          .toBuffer();

        const [bgMeta, resizedMeta] = await Promise.all([
          sharp(resolvedBgPath).metadata(),
          sharp(resizedBuffer).metadata(),
        ]);

        let bgBuffer;
        if (
          resizedMeta.width > bgMeta.width ||
          resizedMeta.height > bgMeta.height
        ) {
          // Resize background to match image
          bgBuffer = await sharp(resolvedBgPath)
            .resize(resizedMeta.width, resizedMeta.height, { fit: "cover" })
            .toBuffer();
        } else {
          // Crop background to match image dimensions
          const left = Math.floor((bgMeta.width - resizedMeta.width) / 2);
          const top = Math.floor((bgMeta.height - resizedMeta.height) / 2);
          bgBuffer = await sharp(resolvedBgPath)
            .extract({
              width: resizedMeta.width,
              height: resizedMeta.height,
              left: Math.max(0, left),
              top: Math.max(0, top),
            })
            .toBuffer();
        }

        await sharp(bgBuffer)
          .composite([{ input: resizedBuffer, blend: "over" }])
          .png({ quality: Math.round(quality), compressionLevel: 6 })
          .toFile(outputPath);

        return outputPath;
      }
      sharpInstance = sharpInstance.png({
        quality: Math.round(quality),
        compressionLevel: 6,
      });
      break;

    case "webp":
      sharpInstance = sharpInstance.webp({ quality });
      break;

    case "tiff":
    case "tif":
      sharpInstance = sharpInstance.tiff({ quality });
      break;
  }

  // Write the output file (skip if PNG with background was already handled)
  if (!(targetFormat === "png" && resolvedBgPath && fs.existsSync(resolvedBgPath))) {
    await sharpInstance.toFile(outputPath);
  }

  return outputPath;
}

/**
 * Creates resized and original copies of an image in a temp directory.
 *
 * @param {Buffer} imageBuffer - The image buffer.
 * @param {string} imageFilename - Original filename.
 * @param {string} tempDir - Temp directory path.
 * @param {Object} [resizeOptions={}] - Resize options.
 * @param {boolean} [isEps=false] - Whether the source is an EPS file.
 * @param {string|null} [originalEpsPath=null] - Original EPS file path.
 * @param {string|null} [gsPath=null] - Ghostscript path for EPS conversion.
 * @returns {Promise<{resizedPath: string, originalPath: string}>} Paths to the temp files.
 */
async function createTempImages(
  imageBuffer,
  imageFilename,
  tempDir,
  resizeOptions = {},
  isEps = false,
  originalEpsPath = null,
  gsPath = null
) {
  const timestamp = Date.now();
  const baseFilename = path.basename(imageFilename);
  const tempResizedPath = path.join(
    tempDir,
    `resized_${timestamp}_${baseFilename}`
  );
  const tempOriginalPath = path.join(
    tempDir,
    `original_${timestamp}_${baseFilename}`
  );

  // For EPS files, convert to PNG with background first
  if (isEps && originalEpsPath && gsPath) {
    const { convertEpsToPng } = require("./epsConverter");
    const pngWithBgPath = await convertEpsToPng(
      originalEpsPath,
      gsPath,
      50,
      true,
      false
    );
    imageBuffer = await fs.promises.readFile(pngWithBgPath);
  }

  await resizeImage(imageBuffer, tempResizedPath, resizeOptions);
  await fs.promises.writeFile(tempOriginalPath, imageBuffer);

  return { resizedPath: tempResizedPath, originalPath: tempOriginalPath };
}

module.exports = { resizeImage, createTempImages };
