const fs = require("fs");
const path = require("path");
const os = require("os");
const sharp = require("sharp");
const { execFile } = require("child_process");

const { getBackgroundImage } = require("./background");

/**
 * Promisified execFile wrapper
 * @param {string} command - Executable path
 * @param {string[]} args - Command arguments
 * @returns {Promise<{stdout: string, stderr: string}>}
 */
function execPromise(command, args) {
  return new Promise((resolve, reject) => {
    execFile(command, args, (error, stdout, stderr) => {
      if (error) reject(error);
      else resolve({ stdout, stderr });
    });
  });
}

/**
 * Convert an EPS file to PNG using Ghostscript
 * @param {string} inputPath - Path to EPS file
 * @param {string} gsPath - Ghostscript executable path
 * @param {number} [resolution=50] - DPI for conversion
 * @param {boolean} [addBackground=false] - Composite onto background
 * @param {boolean} [isForPreview=false] - Use white background for preview
 * @returns {Promise<string>} Path to output PNG
 */
async function convertEpsToPng(
  inputPath,
  gsPath,
  resolution = 50,
  addBackground = false,
  isForPreview = false,
) {
  if (!fs.existsSync(inputPath)) {
    throw new Error("Input file does not exist.");
  }
  if (path.extname(inputPath).toLowerCase() !== ".eps") {
    throw new Error("Input file must be an EPS file.");
  }
  if (!gsPath || !fs.existsSync(gsPath)) {
    throw new Error("Valid Ghostscript path is required.");
  }

  const tempDir = path.join(os.tmpdir(), "eps-conversion");
  if (!fs.existsSync(tempDir)) {
    await fs.promises.mkdir(tempDir, { recursive: true });
  }

  const outPath = path.join(
    tempDir,
    `${path.basename(inputPath, ".eps")}_${Date.now()}.png`,
  );

  const gsCommand = gsPath.replace(/^"|"$/g, "");
  const gsArgs = [
    "-dSAFER",
    "-dBATCH",
    "-dNOPAUSE",
    "-dEPSCrop",
    `-r${resolution}`,
    "-sDEVICE=pngalpha",
    `-sOutputFile=${outPath}`,
    inputPath,
  ];

  try {
    await execPromise(gsCommand, gsArgs);

    if (!fs.existsSync(outPath)) {
      throw new Error("PNG output file was not created");
    }

    // Add background compositing if requested
    if (addBackground) {
      try {
        const finalOutPath = path.join(
          tempDir,
          `${path.basename(inputPath, ".eps")}_with_bg_${Date.now()}.png`,
        );
        const metadata = await sharp(outPath).metadata();

        if (isForPreview) {
          // White background for preview
          await sharp({
            create: {
              width: metadata.width,
              height: metadata.height,
              channels: 4,
              background: { r: 255, g: 255, b: 255, alpha: 1 },
            },
          })
            .composite([{ input: outPath }])
            .png()
            .toFile(finalOutPath);
        } else {
          // Custom background image
          const bgPath = await getBackgroundImage();
          await sharp(bgPath)
            .resize(metadata.width, metadata.height, { fit: "cover" })
            .composite([{ input: outPath }])
            .png()
            .toFile(finalOutPath);
        }

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
    if (fs.existsSync(outPath)) {
      try {
        await fs.promises.unlink(outPath);
      } catch (e) {}
    }
    throw new Error(`EPS Conversion failed: ${err.message}`);
  }
}

/**
 * Convert an EPS file to JPG
 * @param {string} inputPath - Path to EPS file
 * @param {string} gsPath - Ghostscript executable path
 * @param {string|null} [outputPath=null] - Custom output path
 * @param {number} [resolution=100] - DPI for conversion
 * @param {number} [quality=100] - JPEG quality
 * @param {string} [backgroundColor="white"] - Background color
 * @returns {Promise<string>} Path to output JPG
 */
async function convertEpsToJpg(
  inputPath,
  gsPath,
  outputPath = null,
  resolution = 100,
  quality = 100,
  backgroundColor = "white",
) {
  try {
    const pngPath = await convertEpsToPng(inputPath, gsPath, resolution);

    let jpgOutputPath =
      outputPath ||
      path.join(
        path.dirname(inputPath),
        `${path.basename(inputPath, ".eps")}.jpg`,
      );

    const outputDir = path.dirname(jpgOutputPath);
    if (!fs.existsSync(outputDir)) {
      await fs.promises.mkdir(outputDir, { recursive: true });
    }

    const metadata = await sharp(pngPath).metadata();

    await sharp({
      create: {
        width: metadata.width,
        height: metadata.height,
        channels: 3,
        background: backgroundColor,
      },
    })
      .composite([{ input: pngPath }])
      .jpeg({ quality })
      .toFile(jpgOutputPath);

    try {
      await fs.promises.unlink(pngPath);
    } catch (e) {
      console.warn(`Warning: Failed to clean up: ${e.message}`);
    }

    return jpgOutputPath;
  } catch (err) {
    throw new Error(`EPS to JPG conversion failed: ${err.message}`);
  }
}

module.exports = { convertEpsToJpg, convertEpsToPng };
