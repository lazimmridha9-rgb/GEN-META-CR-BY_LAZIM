const fs = require("fs");
const path = require("path");
const os = require("os");
const sharp = require("sharp");

const { getBackgroundImage } = require("./backgroundManager");

/**
 * Converts an SVG file to PNG using sharp.
 * Optionally composites the result over a background image.
 *
 * @param {string} inputPath - Path to the SVG file.
 * @param {number} [resolution=50] - Render density (DPI).
 * @param {boolean} [addBackground=false] - Whether to add a background.
 * @param {boolean} [isForPreview=false] - Whether this is a preview (uses white bg instead of custom).
 * @returns {Promise<string>} Path to the output PNG file.
 * @throws {Error} If the input file is missing or not an SVG.
 */
async function convertSvgToPng(
  inputPath,
  resolution = 50,
  addBackground = false,
  isForPreview = false
) {
  if (!fs.existsSync(inputPath)) {
    throw new Error("Input file does not exist.");
  }
  if (path.extname(inputPath).toLowerCase() !== ".svg") {
    throw new Error("Input file must be an SVG file.");
  }

  const tempDir = path.join(os.tmpdir(), "svg-conversion");
  if (!fs.existsSync(tempDir)) {
    await fs.promises.mkdir(tempDir, { recursive: true });
  }

  const timestamp = Date.now();
  const baseName = path.basename(inputPath, ".svg");
  const outPath = path.join(
    tempDir,
    `${baseName}_${timestamp}${isForPreview ? "_preview" : ""}.png`
  );

  try {
    const svgBuffer = await fs.promises.readFile(inputPath);
    await sharp(svgBuffer, { density: resolution }).png().toFile(outPath);

    if (!fs.existsSync(outPath)) {
      throw new Error("PNG output file was not created");
    }

    // Optionally composite over a background
    if (addBackground && !isForPreview) {
      try {
        const finalOutPath = path.join(
          tempDir,
          `${baseName}_with_bg_${timestamp}.png`
        );
        const bgPath = await getBackgroundImage();
        const metadata = await sharp(outPath).metadata();

        await sharp(bgPath)
          .resize(metadata.width, metadata.height, { fit: "cover" })
          .composite([{ input: outPath }])
          .png()
          .toFile(finalOutPath);

        // Clean up the intermediate file
        try {
          await fs.promises.unlink(outPath);
        } catch (e) {
          console.warn(`Warning: Failed to clean up: ${e.message}`);
        }

        return finalOutPath;
      } catch (bgError) {
        console.warn(`Warning: Failed to add background: ${bgError.message}`);
        return outPath;
      }
    }

    return outPath;
  } catch (err) {
    // Clean up partial output on failure
    if (fs.existsSync(outPath)) {
      try {
        await fs.promises.unlink(outPath);
      } catch (e) {}
    }
    throw new Error(`SVG Conversion failed: ${err.message}`);
  }
}

module.exports = { convertSvgToPng };
