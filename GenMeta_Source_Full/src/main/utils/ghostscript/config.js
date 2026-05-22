const os = require('os');
const path = require('path');

const GHOSTSCRIPT_URLS = {
  x64: 'https://github.com/ArtifexSoftware/ghostpdl-downloads/releases/download/gs10060/gs10060w64.exe',
  x86: 'https://github.com/ArtifexSoftware/ghostpdl-downloads/releases/download/gs10060/gs10060w32.exe',
};

/**
 * Returns the appropriate Ghostscript download URL for the current architecture
 * @returns {string} Download URL
 */
function getDownloadUrl() {
  return GHOSTSCRIPT_URLS[os.arch() === 'x64' ? 'x64' : 'x86'];
}

/**
 * Extracts the filename from a download URL
 * @param {string} url - Download URL
 * @returns {string} Filename
 */
function getFilename(url) {
  return path.basename(url);
}

module.exports = { GHOSTSCRIPT_URLS, getDownloadUrl, getFilename };
