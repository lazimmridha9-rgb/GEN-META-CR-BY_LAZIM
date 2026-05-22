const path = require("path");
const fs = require("fs");
const os = require("os");
const crypto = require("crypto");

const { app } = require("electron");

/**
 * Get or create a persistent device ID for this machine
 * @returns {string} UUID device identifier
 */
function getDeviceId() {
  const deviceFilePath = path.join(app.getPath("userData"), "device-id.txt");

  if (fs.existsSync(deviceFilePath)) {
    return fs.readFileSync(deviceFilePath, "utf8").trim();
  }

  const newId = crypto.randomUUID();
  fs.writeFileSync(deviceFilePath, newId, "utf8");
  return newId;
}

module.exports = { getDeviceId };
