// Local modules
const { isGuestSession, getGuestAuthData } = require("./store");
const { createGuestSession, endGuestSession, getCurrentGuestSession } = require("./session");

/**
 * Entry point for guest authentication service.
 * Provides methods for creating, managing, and ending guest sessions.
 */

/**
 * Logs in as a guest user with auto-generated profile.
 *
 * @returns {Object} Guest session data with success status.
 */
function loginAsGuest() {
  try {
    const guestData = createGuestSession();
    return {
      success: true,
      message: "Guest login successful",
      username: guestData.guestName,
      email: guestData.guestEmail,
      guestId: guestData.guestId,
      isGuest: true,
      planType: "Premium",
      credits: Infinity,
      isUnlimited: true,
    };
  } catch (error) {
    console.error("Guest login error:", error);
    return {
      success: false,
      message: error.message || "Guest login failed",
    };
  }
}

/**
 * Logs out the current guest user.
 *
 * @returns {Object} Result with success status.
 */
function logoutGuest() {
  try {
    endGuestSession();
    return {
      success: true,
      message: "Guest session ended",
    };
  } catch (error) {
    console.error("Guest logout error:", error);
    return {
      success: false,
      message: error.message || "Guest logout failed",
    };
  }
}

/**
 * Checks if there is an active guest session.
 *
 * @returns {boolean} True if guest session is active.
 */
function isGuestLoggedIn() {
  return isGuestSession();
}

/**
 * Gets the current guest session information.
 *
 * @returns {Object|null} Guest session data or null.
 */
function getGuestInfo() {
  return getCurrentGuestSession();
}

module.exports = {
  loginAsGuest,
  logoutGuest,
  isGuestLoggedIn,
  getGuestInfo,
};
