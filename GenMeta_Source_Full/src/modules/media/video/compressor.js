const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");
const os = require("os");

const { app } = require("electron");

/**
 * Get FFmpeg path with proper handling for packaged apps
 * @returns {string} Path to FFmpeg binary
 */
function getFFmpegPath() {
  try {
    if (app && app.isPackaged) {
      const appPath = app.getAppPath();
      const unpackedPath = appPath.replace("app.asar", "app.asar.unpacked");

      const possiblePaths = [
        path.join(
          unpackedPath,
          "node_modules",
          "ffmpeg-static",
          "ffmpeg.exe",
        ),
        path.join(unpackedPath, "node_modules", "ffmpeg-static", "ffmpeg"),
        path.join(
          process.resourcesPath,
          "app.asar.unpacked",
          "node_modules",
          "ffmpeg-static",
          "ffmpeg.exe",
        ),
        path.join(
          process.resourcesPath,
          "app.asar.unpacked",
          "node_modules",
          "ffmpeg-static",
          "ffmpeg",
        ),
      ];

      for (const ffmpegPath of possiblePaths) {
        if (fs.existsSync(ffmpegPath)) return ffmpegPath;
      }

      console.warn(
        "FFmpeg binary not found in packaged app, falling back to require",
      );
    }

    return require("ffmpeg-static");
  } catch (error) {
    console.error("Error getting FFmpeg path:", error);
    return require("ffmpeg-static");
  }
}

/**
 * Get FFprobe path with proper handling for packaged apps
 * @returns {string} Path to FFprobe binary
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
          "ffprobe.exe",
        ),
        path.join(
          unpackedPath,
          "node_modules",
          "ffprobe-static",
          "bin",
          "linux",
          "x64",
          "ffprobe",
        ),
        path.join(
          unpackedPath,
          "node_modules",
          "ffprobe-static",
          "bin",
          "darwin",
          "x64",
          "ffprobe",
        ),
        path.join(
          process.resourcesPath,
          "app.asar.unpacked",
          "node_modules",
          "ffprobe-static",
          "bin",
          "win32",
          "x64",
          "ffprobe.exe",
        ),
        path.join(
          process.resourcesPath,
          "app.asar.unpacked",
          "node_modules",
          "ffprobe-static",
          "bin",
          "linux",
          "x64",
          "ffprobe",
        ),
        path.join(
          process.resourcesPath,
          "app.asar.unpacked",
          "node_modules",
          "ffprobe-static",
          "bin",
          "darwin",
          "x64",
          "ffprobe",
        ),
      ];

      for (const ffprobePath of possiblePaths) {
        if (fs.existsSync(ffprobePath)) return ffprobePath;
      }

      console.warn(
        "FFprobe binary not found in packaged app, falling back to require",
      );
    }

    return require("ffprobe-static").path;
  } catch (error) {
    console.error("Error getting FFprobe path:", error);
    return require("ffprobe-static").path;
  }
}

// Initialize and validate binary paths
const ffmpegPath = getFFmpegPath();
const ffprobePath = getFFprobePath();

if (!fs.existsSync(ffmpegPath)) {
  console.error(`FFmpeg binary not found at: ${ffmpegPath}`);
  throw new Error(`FFmpeg binary not accessible at: ${ffmpegPath}`);
}

if (!fs.existsSync(ffprobePath)) {
  console.error(`FFprobe binary not found at: ${ffprobePath}`);
  throw new Error(`FFprobe binary not accessible at: ${ffprobePath}`);
}

// Configure fluent-ffmpeg
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

/**
 * Compress a video for Gemini upload
 * @param {string} inputPath - Input video path
 * @param {string} outputDir - Output directory
 * @param {object} [options] - Compression options
 * @returns {Promise<string>} Compressed video path
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
        console.error("\nError during video compression:", err.message);
        reject(err);
      });

    command.run();
  });
}

/**
 * Create a temporary compressed video in the system temp directory
 * @param {string} inputPath - Input video path
 * @param {object} [options] - Compression options
 * @returns {Promise<string>} Compressed video path
 */
async function createTempCompressedVideo(inputPath, options = {}) {
  const tempDir = path.join(os.tmpdir(), "video-processing");
  return await compressVideo(inputPath, tempDir, options);
}

/**
 * Get video metadata using FFprobe
 * @param {string} videoPath - Path to video file
 * @returns {Promise<object>} Video metadata
 */
function getVideoMetadata(videoPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }

      const videoStream = metadata.streams.find(
        (stream) => stream.codec_type === "video",
      );
      const audioStream = metadata.streams.find(
        (stream) => stream.codec_type === "audio",
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
              fps: eval(videoStream.r_frame_rate),
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
 * Check if a video needs compression based on size and dimensions
 * @param {string} videoPath - Path to video file
 * @param {object} [limits] - Size/dimension limits
 * @returns {Promise<boolean>} Whether compression is needed
 */
async function shouldCompressVideo(videoPath, limits = {}) {
  const defaultLimits = {
    maxSizeMB: 50,
    maxWidth: 1280,
    maxHeight: 720,
    maxBitrate: 2000000,
  };

  const actualLimits = { ...defaultLimits, ...limits };

  try {
    const stats = fs.statSync(videoPath);
    const fileSizeMB = stats.size / (1024 * 1024);

    if (fileSizeMB > actualLimits.maxSizeMB) return true;

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
    return true; // Assume compression needed if analysis fails
  }
}

/**
 * Format bytes into a human-readable string
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size string
 */
function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + " " + sizes[i];
}

/**
 * Test FFmpeg installation and functionality
 * @returns {Promise<object>} Test result with status and details
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
  formatBytes,
  getVideoMetadata,
  shouldCompressVideo,
  testFFmpegInstallation,
};
