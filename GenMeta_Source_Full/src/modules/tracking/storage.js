const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const { app } = require("electron");

/**
 * Get current date in Los Angeles timezone (for daily reset tracking)
 * @returns {string} Date string in YYYY-MM-DD format
 */
function getLADate() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" }),
  )
    .toISOString()
    .split("T")[0];
}

/**
 * Get the path to the API tracker JSON file
 * @returns {string} Full path to tracker file
 */
function getTrackerFilePath() {
  return path.join(app.getPath("userData"), "api-tracker.json");
}

/**
 * Load tracker data, resetting if date has changed or data is invalid
 * @returns {{ date: string, keys: object }} Tracker data
 */
function loadTrackerData() {
  const filePath = getTrackerFilePath();

  if (!fs.existsSync(filePath)) {
    return { date: getLADate(), keys: {} };
  }

  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const currentDate = getLADate();

    // Validate structure
    if (!data || typeof data !== "object" || !data.keys) {
      console.warn("[API Tracker] Invalid data structure, resetting");
      return { date: currentDate, keys: {} };
    }

    // Reset if date has changed (daily reset)
    if (data.date !== currentDate) {
      console.log(
        `[API Tracker] Date changed from ${data.date} to ${currentDate}, resetting tracker`,
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
 * Save tracker data to disk
 * @param {object} data - Tracker data to save
 */
function saveTrackerData(data) {
  try {
    fs.writeFileSync(
      getTrackerFilePath(),
      JSON.stringify(data, null, 2),
      "utf8",
    );
  } catch (error) {
    console.error("[API Tracker] Error saving tracker data:", error.message);
  }
}

/**
 * Hash an API key for anonymous tracking
 * @param {string} apiKey - The API key to hash
 * @returns {string} SHA-256 hex digest
 */
function hashApiKey(apiKey) {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
}

module.exports = { getLADate, hashApiKey, loadTrackerData, saveTrackerData };
