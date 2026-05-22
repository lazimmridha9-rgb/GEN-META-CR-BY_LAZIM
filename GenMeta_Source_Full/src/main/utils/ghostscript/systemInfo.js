const os = require('os');
const { app } = require('electron');
const { getDownloadUrl } = require('./config');
const { getDownloadsPath } = require('./downloader');

/**
 * Returns system information relevant to Ghostscript
 * @returns {Object} System info object
 */
function getSystemInfo() {
  return {
    platform: 'win32',
    arch: os.arch(),
    downloadUrl: getDownloadUrl(),
    appDataPath: app.getPath('userData'),
    downloadsPath: getDownloadsPath(),
  };
}

module.exports = { getSystemInfo };
