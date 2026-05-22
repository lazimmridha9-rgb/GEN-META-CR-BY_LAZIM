// Local modules
const { saveGuestAuthData, getGuestAuthData, clearGuestAuthData } = require("./store");

/**
 * Generates a unique guest ID based on timestamp and random string.
 *
 * @returns {string} A unique guest identifier.
 */
function generateGuestId() {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 10);
  return `guest_${timestamp}_${randomStr}`;
}

/**
 * Generates a display name for the guest user.
 *
 * @returns {string} A friendly guest display name.
 */
function generateGuestName() {
  const adjectives = ["Happy", "Creative", "Swift", "Bright", "Clever"];
  const nouns = ["Explorer", "Creator", "Designer", "Artist", "Maker"];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj} ${noun}`;
}

/**
 * Creates a new guest session with auto-generated profile data.
 *
 * @returns {Object} Guest session data including id, name, email, and login time.
 */
function createGuestSession() {
  const guestId = generateGuestId();
  const guestName = generateGuestName();
  const guestEmail = `${guestId}@guest.genmeta.local`;
  const loginTime = new Date().toISOString();

  const guestData = {
    isGuest: true,
    guestId,
    guestName,
    guestEmail,
    loginTime,
    isUnlimited: true,
    planType: "Premium",
    credits: Infinity,
    maxFilesPerBatch: Infinity,
  };

  saveGuestAuthData(guestData);
  return guestData;
}

/**
 * Ends the current guest session by clearing guest auth data.
 *
 * @returns {boolean} True if session was ended successfully.
 */
function endGuestSession() {
  return clearGuestAuthData();
}

/**
 * Gets the current guest session data.
 *
 * @returns {Object|null} Guest session data or null if no active guest session.
 */
function getCurrentGuestSession() {
  const guestData = getGuestAuthData();
  if (guestData.isGuest && guestData.guestId) {
    return guestData;
  }
  return null;
}

module.exports = {
  createGuestSession,
  endGuestSession,
  getCurrentGuestSession,
  generateGuestId,
  generateGuestName,
};
