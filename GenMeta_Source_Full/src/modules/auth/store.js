const { app } = require("electron");
const fs = require("fs");
const path = require("path");

const { logStartup } = require("../../utils/logStartup");

/**
 * Get the path to the auth.json file
 * @returns {string} Full path to auth.json
 */
function getAuthDataPath() {
  return path.join(app.getPath("userData"), "auth.json");
}

/**
 * Check if the user is currently logged in
 * @returns {boolean} True if a valid secretKey exists in auth.json
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
 * Save auth data (secretKey) to auth.json
 * @param {string} secretKey - The secret key to save
 * @returns {boolean} True if save succeeded
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
 * Load auth data from auth.json
 * @returns {{ secretKey: string }} Auth data object
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

module.exports = { getAuthData, getAuthDataPath, isUserLoggedIn, saveAuthData };
