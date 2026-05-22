// Node modules
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { app } = require("electron");

/**
 * Gets the current date in the America/Los_Angeles timezone.
 * Used for daily reset of API tracking data.
 *
 * @returns {string} Date string in YYYY-MM-DD format.
 */
function getLADate() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" })
  )
    .toISOString()
    .split("T")[0];
}

/**
 * Returns the absolute path to the API tracker JSON file.
 *
 * @returns {string} Full path to api-tracker.json.
 */
function getTrackerFilePath() {
  return path.join(app.getPath("userData"), "api-tracker.json");
}

/**
 * Loads and validates the tracker data from disk.
 * Resets data if the date has changed or the file is corrupted.
 *
 * @returns {Object} Tracker data with date and keys.
 */
function loadTrackerData() {
  const filePath = getTrackerFilePath();

  if (!fs.existsSync(filePath)) {
    return { date: getLADate(), keys: {} };
  }

  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const currentDate = getLADate();

    // Validate data structure
    if (!data || typeof data !== "object" || !data.keys) {
      console.warn("[API Tracker] Invalid data structure, resetting");
      return { date: currentDate, keys: {} };
    }

    // Reset if the date has changed (daily reset)
    if (data.date !== currentDate) {
      console.log(
        `[API Tracker] Date changed from ${data.date} to ${currentDate}, resetting tracker`
      );
      return { date: currentDate, keys: {} };
    }

    return data;
  } catch (error) {
    console.error("[API Tracker] Error loading tracker data:", error.message);
    return { date: getLADate(), keys: {} };
  }
}

/**
 * Saves tracker data to disk.
 *
 * @param {Object} data - The tracker data to save.
 */
function saveTrackerData(data) {
  try {
    fs.writeFileSync(getTrackerFilePath(), JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error("[API Tracker] Error saving tracker data:", error.message);
  }
}

/**
 * Creates a SHA-256 hash of an API key for secure storage.
 *
 * @param {string} apiKey - The API key to hash.
 * @returns {string} Hex-encoded SHA-256 hash.
 */
function hashApiKey(apiKey) {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
}

module.exports = { getLADate, loadTrackerData, saveTrackerData, hashApiKey };
