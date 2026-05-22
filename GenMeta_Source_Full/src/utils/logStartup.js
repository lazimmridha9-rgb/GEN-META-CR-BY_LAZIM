// Node modules
const fs = require("fs");
const path = require("path");
const { app } = require("electron");

/**
 * Appends a timestamped message to the startup log file.
 *
 * @param {string} message - The message to log.
 */
function logStartup(message) {
  const logPath = path.join(app.getPath("userData"), "startup-log.txt");

  try {
    fs.appendFileSync(
      logPath,
      `${new Date().toISOString()} - ${message}\n`,
      "utf8"
    );
  } catch (err) {
    console.error("Failed to write startup log:", err);
  }
}

module.exports = { logStartup };
