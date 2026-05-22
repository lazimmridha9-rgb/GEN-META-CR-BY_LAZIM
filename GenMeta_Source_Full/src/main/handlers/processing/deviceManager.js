const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const crypto = require('crypto');

/**
 * Gets or creates a unique device identifier
 * @returns {string} UUID device identifier
 */
function getDeviceId() {
  const deviceFilePath = path.join(app.getPath('userData'), 'device-id.txt');

  if (fs.existsSync(deviceFilePath)) {
    return fs.readFileSync(deviceFilePath, 'utf8').trim();
  }

  const newId = crypto.randomUUID();
  fs.writeFileSync(deviceFilePath, newId, 'utf8');
  return newId;
}

module.exports = { getDeviceId };
