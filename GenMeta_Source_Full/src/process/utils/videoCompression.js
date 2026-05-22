const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { app } = require("electron");

// ============================================================================
// FFmpeg / FFprobe Path Resolution
// ============================================================================

/**
 * Resolves the path to the FFmpeg binary, handling both packaged and
 * development environments.
 *
 * @returns {string} The absolute path to the FFmpeg executable.
 */
function getFFmpegPath() {
  try {
    if (app && app.isPackaged) {
      // In a packaged app, binaries live in app.asar.unpacked
      const appPath = app.getAppPath();
      const unpackedPath = appPath.replace("app.asar", "app.asar.unpacked");

      const possiblePaths = [
        path.join(
          unpackedPath,
          "node_modules",
          "ffmpeg-static",
          "ffmpeg.exe"
        ),
        path.join(unpackedPath, "node_modules", "ffmpeg-static", "ffmpeg"),
        path.join(
          process.resourcesPath,
          "app.asar.unpacked",
          "node_modules",
          "ffmpeg-static",
          "ffmpeg.exe"
        ),
        path.join(
          process.resourcesPath,
          "app.asar.unpacked",
          "node_modules",
          "ffmpeg-static",
          "ffmpeg"
        ),
      ];

      for (const ffmpegPath of possiblePaths) {
        if (fs.existsSync(ffmpegPath)) {
          return ffmpegPath;
        }
      }

      console.warn(
        "FFmpeg binary not found in packaged app, falling back to require"
      );
    }

    // Fallback to require (development mode)
    return require("ffmpeg-static");
  } catch (error) {
    console.error("Error getting FFmpeg path:", error);
    return require("ffmpeg-static");
  }
}

/**
 * Resolves the path to the FFprobe binary, handling both packaged and
 * development environments.
 *
 * @returns {string} The absolute path to the FFprobe executable.
 */
function getFFprobePath() {
  try {
    if (app && app.isPackaged) {
      const appPath = app.getAppPath();
      const unpackedPath = appPath.replace("app.asar", "app.asar.unpacked");

      const possiblePaths = [
        path.join(
          unpackedPath,
          "node_modules",
          "ffprobe-static",
          "bin",
          "win32",
          "x64",
          "ffprobe.exe"
        ),
        path.join(
          unpackedPath,
          "node_modules",
          "ffprobe-static",
          "bin",
          "linux",
          "x64",
          "ffprobe"
        ),
        path.join(
          unpackedPath,
          "node_modules",
          "ffprobe-static",
          "bin",
          "darwin",
          "x64",
          "ffprobe"
        ),
        path.join(
          process.resourcesPath,
          "app.asar.unpacked",
          "node_modules",
          "ffprobe-static",
          "bin",
          "win32",
          "x64",
          "ffprobe.exe"
        ),
        path.join(
          process.resourcesPath,
          "app.asar.unpacked",
          "node_modules",
          "ffprobe-static",
          "bin",
          "linux",
          "x64",
          "ffprobe"
        ),
        path.join(
          process.resourcesPath,
          "app.asar.unpacked",
          "node_modules",
          "ffprobe-static",
          "bin",
          "darwin",
          "x64",
          "ffprobe"
        ),
      ];

      for (const ffprobePath of possiblePaths) {
        if (fs.existsSync(ffprobePath)) {
          return ffprobePath;
        }
      }

      console.warn(
        "FFprobe binary not found in packaged app, falling back to require"
      );
    }

    return require("ffprobe-static").path;
  } catch (error) {
    console.error("Error getting FFprobe path:", error);
    return require("ffprobe-static").path;
  }
}

// Resolve and validate binary paths
const ffmpegPath = getFFmpegPath();
const ffprobePath = getFFprobePath();

if (!fs.existsSync(ffmpegPath)) {
  console.error(`FFmpeg binary not found at: ${ffmpegPath}`);
  console.error("This usually happens when:");
  console.error("1. The app is packaged but FFmpeg binaries are not included");
  console.error("2. The ffmpeg-static package is not properly installed");
  console.error("3. The binary path resolution failed for packaged apps");
  throw new Error(`FFmpeg binary not accessible at: ${ffmpegPath}`);
}

if (!fs.existsSync(ffprobePath)) {
  console.error(`FFprobe binary not found at: ${ffprobePath}`);
  console.error("This usually happens when:");
  console.error("1. The app is packaged but FFprobe binaries are not included");
  console.error("2. The ffprobe-static package is not properly installed");
  console.error("3. The binary path resolution failed for packaged apps");
  throw new Error(`FFprobe binary not accessible at: ${ffprobePath}`);
}

// Configure fluent-ffmpeg with resolved paths
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// ============================================================================
// Video Processing Functions
// ============================================================================

/**
 * Compresses a video file for Gemini API upload.
 *
 * @param {string} inputPath - Path to the input video file.
 * @param {string} outputDir - Directory to store the compressed video.
 * @param {Object} [options={}] - Compression options (videoBitrate, audioBitrate, maxWidth, videoCodec, audioCodec).
 * @returns {Promise<string>} Path to the compressed video file.
 */
async function compressVideo(inputPath, outputDir, options = {}) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(inputPath)) {
      reject(new Error(`Input video file not found: ${inputPath}`));
      return;
    }

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const inputFilename = path.basename(inputPath, path.extname(inputPath));
    const outputPath = path.join(outputDir, `${inputFilename}_compressed.mp4`);

    // Default compression settings optimized for Gemini
    const defaultOptions = {
      videoBitrate: "1000k",
      audioBitrate: "128k",
      maxWidth: 1280,
      videoCodec: "libx264",
      audioCodec: "aac",
    };

    const settings = { ...defaultOptions, ...options };

    const command = ffmpeg(inputPath)
      .output(outputPath)
      .videoCodec(settings.videoCodec)
      .audioCodec(settings.audioCodec)
      .videoBitrate(settings.videoBitrate)
      .audioBitrate(settings.audioBitrate)
      .size(`${settings.maxWidth}x?`)
      .on("start", () => {})
      .on("progress", () => {})
      .on("end", () => {
        resolve(outputPath);
      })
      .on("error", (err) => {
        console.error("Error during video compression:", err.message);
        reject(err);
      });

    command.run();
  });
}

/**
 * Creates a temporary compressed video in the system temp directory.
 *
 * @param {string} inputPath - Path to the input video file.
 * @param {Object} [options={}] - Compression options.
 * @returns {Promise<string>} Path to the compressed video in the temp directory.
 */
async function createTempCompressedVideo(inputPath, options = {}) {
  const tempDir = path.join(os.tmpdir(), "video-processing");
  return compressVideo(inputPath, tempDir, options);
}

/**
 * Extracts video metadata using FFprobe.
 *
 * @param {string} videoPath - Path to the video file.
 * @returns {Promise<Object>} Video metadata including duration, size, bitrate, and stream info.
 */
function getVideoMetadata(videoPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }

      const videoStream = metadata.streams.find(
        (stream) => stream.codec_type === "video"
      );
      const audioStream = metadata.streams.find(
        (stream) => stream.codec_type === "audio"
      );

      resolve({
        duration: metadata.format.duration,
        size: metadata.format.size,
        bitrate: metadata.format.bit_rate,
        video: videoStream
          ? {
              codec: videoStream.codec_name,
              width: videoStream.width,
              height: videoStream.height,
              fps: eval(videoStream.r_frame_rate), // Convert fraction to decimal
              bitrate: videoStream.bit_rate,
            }
          : null,
        audio: audioStream
          ? {
              codec: audioStream.codec_name,
              bitrate: audioStream.bit_rate,
              sampleRate: audioStream.sample_rate,
              channels: audioStream.channels,
            }
          : null,
      });
    });
  });
}

/**
 * Determines whether a video needs compression based on file size and dimensions.
 *
 * @param {string} videoPath - Path to the video file.
 * @param {Object} [limits={}] - Size and dimension limits (maxSizeMB, maxWidth, maxHeight, maxBitrate).
 * @returns {Promise<boolean>} True if the video exceeds the specified limits.
 */
async function shouldCompressVideo(videoPath, limits = {}) {
  const defaultLimits = {
    maxSizeMB: 50,
    maxWidth: 1280,
    maxHeight: 720,
    maxBitrate: 2000000, // 2 Mbps
  };

  const actualLimits = { ...defaultLimits, ...limits };

  try {
    const stats = fs.statSync(videoPath);
    const fileSizeMB = stats.size / (1024 * 1024);

    if (fileSizeMB > actualLimits.maxSizeMB) {
      return true;
    }

    const metadata = await getVideoMetadata(videoPath);

    if (metadata.video) {
      if (
        metadata.video.width > actualLimits.maxWidth ||
        metadata.video.height > actualLimits.maxHeight ||
        (metadata.video.bitrate &&
          metadata.video.bitrate > actualLimits.maxBitrate)
      ) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.warn(`Could not analyze video ${videoPath}:`, error.message);
    // If analysis fails, assume compression is needed for safety
    return true;
  }
}

/**
 * Formats a byte count into a human-readable string.
 *
 * @param {number} bytes - The number of bytes.
 * @returns {string} Formatted string (e.g., "1.23 MB").
 */
function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + " " + sizes[i];
}

/**
 * Tests the FFmpeg installation by running a version check.
 *
 * @returns {Promise<Object>} Test result with success status, message, and binary paths.
 */
async function testFFmpegInstallation() {
  return new Promise((resolve) => {
    try {
      const { spawn } = require("child_process");
      const ffmpegProcess = spawn(ffmpegPath, ["-version"], {
        stdio: ["pipe", "pipe", "pipe"],
        windowsHide: true,
      });

      let output = "";
      let errorOutput = "";

      ffmpegProcess.stdout.on("data", (data) => {
        output += data.toString();
      });

      ffmpegProcess.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      ffmpegProcess.on("close", (code) => {
        if (code === 0 || output.includes("ffmpeg version")) {
          resolve({
            success: true,
            message: "FFmpeg is working correctly",
            version: output.split("\n")[0],
            ffmpegPath,
            ffprobePath,
          });
        } else {
          resolve({
            success: false,
            message: `FFmpeg test failed with code ${code}`,
            error: errorOutput,
            ffmpegPath,
            ffprobePath,
          });
        }
      });

      ffmpegProcess.on("error", (error) => {
        resolve({
          success: false,
          message: "Failed to start FFmpeg process",
          error: error.message,
          ffmpegPath,
          ffprobePath,
        });
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        ffmpegProcess.kill();
        resolve({
          success: false,
          message: "FFmpeg test timed out",
          ffmpegPath,
          ffprobePath,
        });
      }, 10000);
    } catch (error) {
      resolve({
        success: false,
        message: "Error testing FFmpeg",
        error: error.message,
        ffmpegPath,
        ffprobePath,
      });
    }
  });
}

module.exports = {
  compressVideo,
  createTempCompressedVideo,
  getVideoMetadata,
  shouldCompressVideo,
  formatBytes,
  testFFmpegInstallation,
};
