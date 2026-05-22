const os = require("os");

const { app } = require("electron");
const { getDownloadUrl } = require("./config");
const { getDownloadsPath } = require("./downloader");

/**
 * Get system information relevant to Ghostscript
 * @returns {{ platform: string, arch: string, downloadUrl: string, appDataPath: string, downloadsPath: string }}
 */
function getSystemInfo() {
  return {
    platform: "win32",
    arch: os.arch(),
    downloadUrl: getDownloadUrl(),
    appDataPath: app.getPath("userData"),
    downloadsPath: getDownloadsPath(),
  };
}

module.exports = { getSystemInfo };
