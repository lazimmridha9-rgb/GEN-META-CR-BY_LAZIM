/**
 * Debug utility for the Electron application.
 * Provides logging to both console and a debug log file.
 */

// Node modules
const fs = require("fs");
const path = require("path");
const { app } = require("electron");

// Path for the debug log file
const logPath = path.join(app.getPath("userData"), "debug-log.txt");

// Clear the log file on startup
if (fs.existsSync(logPath)) {
  try {
    fs.writeFileSync(logPath, "", "utf8");
  } catch (err) {
    console.error("Failed to clear debug log file:", err);
  }
}

/**
 * Logs a message to both the console and the debug log file.
 *
 * @param {string} message - The message to log.
 * @param {*} [data=null] - Optional data to include in the log.
 */
function log(message, data = null) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;

  // Log to console
  console.log(logMessage);
  if (data) {
    console.log(data);
  }

  // Log to file
  try {
    const fileContent =
      `${logMessage}\n` +
      (data ? JSON.stringify(data, null, 2) + "\n" : "");
    fs.appendFileSync(logPath, fileContent, "utf8");
  } catch (err) {
    console.error("Failed to write to debug log file:", err);
  }
}

/**
 * Logs an error to both the console and the debug log file.
 *
 * @param {string} message - The error message.
 * @param {Error} [error] - Optional Error object with stack trace.
 */
function logError(message, error) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ERROR: ${message}`;

  // Log to console
  console.error(logMessage);
  if (error) {
    console.error(error);
  }

  // Log to file
  try {
    let errorData = "";
    if (error) {
      errorData = `${error.message}\nStack: ${error.stack}\n`;
    }
    const fileContent = `${logMessage}\n${errorData}`;
    fs.appendFileSync(logPath, fileContent, "utf8");
  } catch (err) {
    console.error("Failed to write error to debug log file:", err);
  }
}

/**
 * Creates a wrapper for IPC handler registration with debug logging.
 *
 * @param {Function} registerFn - The original registration function.
 * @param {string} name - Descriptive name for the handler group.
 * @returns {Function} Wrapped function that logs registration status.
 */
function wrapHandlerRegistration(registerFn, name) {
  return function () {
    log(`Registering IPC handlers: ${name}`);

    try {
      registerFn();
      log(`Successfully registered IPC handlers: ${name}`);
    } catch (error) {
      logError(`Failed to register IPC handlers: ${name}`, error);
      throw error;
    }
  };
}

module.exports = { log, logError, wrapHandlerRegistration };
