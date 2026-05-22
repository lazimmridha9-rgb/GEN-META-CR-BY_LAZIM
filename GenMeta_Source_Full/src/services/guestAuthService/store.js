// Node modules
const { app } = require("electron");
const fs = require("fs");
const path = require("path");

// Local utils
const { logStartup } = require("../../utils/logStartup");

/**
 * Returns the absolute path to the guest-auth.json file.
 *
 * @returns {string} Full path to the guest auth data file.
 */
function getGuestAuthDataPath() {
  return path.join(app.getPath("userData"), "guest-auth.json");
}

/**
 * Checks if the current session is a guest session.
 *
 * @returns {boolean} True if guest session is active.
 */
function isGuestSession() {
  try {
    const guestAuthPath = getGuestAuthDataPath();
    if (fs.existsSync(guestAuthPath)) {
      const guestData = JSON.parse(fs.readFileSync(guestAuthPath, "utf8"));
      return !!guestData.isGuest && !!guestData.guestId;
    }
  } catch (err) {
    logStartup(`Error checking guest session status: ${err.message}`);
  }
  return false;
}

/**
 * Saves guest session data to guest-auth.json.
 *
 * @param {Object} guestData - Guest session data object.
 * @returns {boolean} True if the save was successful.
 */
function saveGuestAuthData(guestData) {
  try {
    const guestAuthPath = getGuestAuthDataPath();
    fs.writeFileSync(guestAuthPath, JSON.stringify(guestData, null, 2));
    return true;
  } catch (err) {
    logStartup(`Error saving guest auth data: ${err.message}`);
    return false;
  }
}

/**
 * Loads guest auth data from guest-auth.json.
 *
 * @returns {Object} Guest auth data object, defaults to empty object if not found.
 */
function getGuestAuthData() {
  try {
    const guestAuthPath = getGuestAuthDataPath();
    if (fs.existsSync(guestAuthPath)) {
      return JSON.parse(fs.readFileSync(guestAuthPath, "utf8"));
    }
  } catch (err) {
    logStartup(`Error loading guest auth data: ${err.message}`);
  }
  return {};
}

/**
 * Clears guest session data by removing guest-auth.json.
 *
 * @returns {boolean} True if cleanup was successful.
 */
function clearGuestAuthData() {
  try {
    const guestAuthPath = getGuestAuthDataPath();
    if (fs.existsSync(guestAuthPath)) {
      fs.unlinkSync(guestAuthPath);
    }
    return true;
  } catch (err) {
    logStartup(`Error clearing guest auth data: ${err.message}`);
    return false;
  }
}

module.exports = {
  getGuestAuthDataPath,
  isGuestSession,
  saveGuestAuthData,
  getGuestAuthData,
  clearGuestAuthData,
};
