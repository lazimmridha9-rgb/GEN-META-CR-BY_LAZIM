// Node modules
const { app } = require("electron");
const fs = require("fs");
const path = require("path");

// Local utils
const { logStartup } = require("../../utils/logStartup");

/**
 * Returns the absolute path to the auth.json file.
 *
 * @returns {string} Full path to the auth data file.
 */
function getAuthDataPath() {
  return path.join(app.getPath("userData"), "auth.json");
}

/**
 * Checks if the user is currently logged in by verifying the auth file.
 *
 * @returns {boolean} True if a valid secret key exists in auth.json.
 */
function isUserLoggedIn() {
  try {
    const authPath = getAuthDataPath();
    if (fs.existsSync(authPath)) {
      const authData = JSON.parse(fs.readFileSync(authPath, "utf8"));
      return !!authData.secretKey;
    }
  } catch (err) {
    logStartup(`Error checking login status: ${err.message}`);
  }
  return false;
}

/**
 * Saves the user's secret key to the auth.json file.
 *
 * @param {string} secretKey - The API secret key to save.
 * @returns {boolean} True if the save was successful.
 */
function saveAuthData(secretKey) {
  try {
    const authPath = getAuthDataPath();
    fs.writeFileSync(authPath, JSON.stringify({ secretKey }, null, 2));
    return true;
  } catch (err) {
    logStartup(`Error saving auth data: ${err.message}`);
    return false;
  }
}

/**
 * Loads the auth data from the auth.json file.
 *
 * @returns {Object} Auth data object, defaults to { secretKey: "" } if not found.
 */
function getAuthData() {
  try {
    const authPath = getAuthDataPath();
    if (fs.existsSync(authPath)) {
      return JSON.parse(fs.readFileSync(authPath, "utf8"));
    }
  } catch (err) {
    logStartup(`Error loading auth data: ${err.message}`);
  }
  return { secretKey: "" };
}

module.exports = { getAuthDataPath, isUserLoggedIn, saveAuthData, getAuthData };
