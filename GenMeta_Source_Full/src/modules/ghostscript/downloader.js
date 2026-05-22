const { app, net } = require("electron");
const path = require("path");
const fs = require("fs").promises;
const { createWriteStream, existsSync } = require("fs");

const { getDownloadUrl, getFilename } = require("./config");

/**
 * Get the Ghostscript downloads directory path
 * @returns {string} Downloads directory path
 */
function getDownloadsPath() {
  return path.join(app.getPath("userData"), "ghostscript-downloads");
}

/**
 * Download Ghostscript installer with progress tracking
 * @param {Function|null} [progressCallback=null] - Callback for progress updates
 * @returns {Promise<string>} Path to downloaded file
 */
async function downloadGhostscript(progressCallback = null) {
  const url = getDownloadUrl();
  const filename = getFilename(url);
  const downloadPath = getDownloadsPath();
  const filePath = path.join(downloadPath, filename);

  // Create download directory
  await fs.mkdir(downloadPath, { recursive: true }).catch((e) => {
    if (e.code !== "EEXIST") throw e;
  });

  // Return existing file if already downloaded
  if (existsSync(filePath)) {
    if (progressCallback) progressCallback(100, 0, 0);
    return filePath;
  }

  return new Promise((resolve, reject) => {
    const request = net.request({ method: "GET", url, redirect: "follow" });
    const file = createWriteStream(filePath);

    let downloadedSize = 0;
    let totalSize = 0;
    let lastProgress = 0;

    request.on("response", (response) => {
      if (response.statusCode !== 200) {
        file.destroy();
        fs.unlink(filePath).catch(() => {});
        reject(
          new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`),
        );
        return;
      }

      totalSize = parseInt(response.headers["content-length"], 10);

      response.on("data", (chunk) => {
        downloadedSize += chunk.length;
        if (totalSize > 0) {
          const progress = Math.round((downloadedSize / totalSize) * 100);
          if (progress >= lastProgress + 2 || progress === 100) {
            if (progressCallback) {
              progressCallback(progress, downloadedSize, totalSize);
            }
            lastProgress = progress;
          }
        }
        file.write(chunk);
      });

      response.on("end", () => {
        file.end();
        setTimeout(() => resolve(filePath), 500);
      });

      response.on("error", (error) => {
        file.destroy();
        fs.unlink(filePath).catch(() => {});
        reject(new Error(`Download failed: ${error.message}`));
      });
    });

    request.on("error", (error) => {
      file.destroy();
      fs.unlink(filePath).catch(() => {});
      reject(new Error(`Request failed: ${error.message}`));
    });

    file.on("error", (error) => {
      fs.unlink(filePath).catch(() => {});
      reject(new Error(`File write error: ${error.message}`));
    });

    request.end();
  });
}

module.exports = { downloadGhostscript, getDownloadsPath };
