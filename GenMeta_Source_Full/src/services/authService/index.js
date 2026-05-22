// Node modules
const { app } = require("electron");
const fs = require("fs");
const path = require("path");

// Local config
const API_CONFIG = require("../../config/api");
const APP_CONFIG = require("../../config/app");

// Local utils
const { logStartup } = require("../../utils/logStartup");

// Local modules
const { isUserLoggedIn, saveAuthData, getAuthData } = require("./store");
const { makeRequest, defaultHeaders } = require("./apiClient");
const { handleGoogleLogin, loginWithEmailPassword } = require("./login");

/**
 * Fetches the API status for a given secret key.
 *
 * @param {string} secretKey - The user's API secret key.
 * @returns {Promise<Object>} Status object containing plan, user, and credit info.
 */
async function getStatus(secretKey) {
  if (!secretKey) {
    throw new Error("Secret key is not set");
  }

  const { statusCode, body } = await makeRequest(
    "GET",
    "/api/v1/app/appkey/stats",
    defaultHeaders(secretKey)
  );

  const parsed = JSON.parse(body);

  if (statusCode === 200 && parsed.success && parsed.data) {
    const { plan, username, status, user } = parsed.data;

    return {
      status: status || "active",
      planType: "Premium",
      planId: plan?.id || null,
      username: username || user?.name || "User",
      expiresIn: null,
      expiresAt: null,
      credit: null,
      credits: Infinity,
      totalCredits: Infinity,
      email: user?.email || null,
      name: user?.name || username || "User",
      aiApiKey: null,
      hasAiApiKey: false,
      isUnlimited: true,
    };
  }

  throw new Error(parsed.message || "Failed to fetch API status");
}

// Track the last API status check timestamp and in-progress state
let lastApiStatusCheck = 0;
let isApiStatusCheckInProgress = false;

/**
 * Checks the API status with debouncing to avoid redundant calls.
 * Sends the result to the main window via IPC.
 *
 * @param {boolean} [forceCheck=false] - If true, uses a shorter debounce interval.
 * @returns {Promise<Object|null>} The API status object, or null if skipped.
 */
async function checkApiStatus(forceCheck = false) {
  try {
    // Prevent duplicate concurrent checks
    if (isApiStatusCheckInProgress) {
      logStartup("API status check already in progress, skipping duplicate call");
      return null;
    }

    // Apply debouncing based on forceCheck flag
    const minInterval = forceCheck
      ? APP_CONFIG.FORCE_CHECK_MIN_INTERVAL
      : APP_CONFIG.API_STATUS_CHECK_INTERVAL;

    if (Date.now() - lastApiStatusCheck < minInterval) {
      logStartup("API status check skipped (debounced)");
      return null;
    }

    lastApiStatusCheck = Date.now();
    isApiStatusCheckInProgress = true;

    const authData = getAuthData();
    if (!authData.secretKey) {
      logStartup("Secret key is not set");
      isApiStatusCheckInProgress = false;
      return;
    }

    const status = await getStatus(authData.secretKey);
    logStartup(`API Status: ${status.status}, Plan: ${status.planType}`);

    // Notify the renderer process
    if (global.mainWindow && !global.mainWindow.isDestroyed()) {
      global.mainWindow.webContents.send("api-status-update", status);
    }

    isApiStatusCheckInProgress = false;
    return status;
  } catch (error) {
    logStartup(`Error checking API status: ${error.message}`);

    // Force logout if the key is not found
    if (error.message === "Key not found") {
      handleForcedLogout();
    }

    if (global.mainWindow && !global.mainWindow.isDestroyed()) {
      global.mainWindow.webContents.send("api-status-update", {
        status: "error",
        error: error.message,
      });
    }

    isApiStatusCheckInProgress = false;
  }
}

/**
 * Forces a logout by clearing auth data and notifying the renderer.
 */
function handleForcedLogout() {
  logStartup("API key not found error detected. Forcing logout...");

  try {
    // Remove auth.json
    const authPath = path.join(app.getPath("userData"), "auth.json");
    if (fs.existsSync(authPath)) {
      fs.unlinkSync(authPath);
    }

    // Clear secretKey from settings.json
    const settingsPath = path.join(app.getPath("userData"), "settings.json");
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
      settings.secretKey = "";
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    }

    // Notify the renderer of forced logout
    if (global.mainWindow && !global.mainWindow.isDestroyed()) {
      global.mainWindow.webContents.send("login-status", {
        isLoggedIn: false,
        forcedLogout: true,
        reason: "API key not found. You have been logged out.",
      });
    }
  } catch (logoutErr) {
    logStartup(`Error during forced logout: ${logoutErr.message}`);
  }
}

/**
 * Verifies a Google OAuth token with the backend.
 *
 * @param {string} token - The Google OAuth token.
 * @returns {Promise<Object>} User data including apiKey, email, and username.
 */
async function verifyGoogleToken(token) {
  const { statusCode, body } = await makeRequest(
    "POST",
    "/api/v1/users/app/verify-google",
    {
      "Content-Type": "application/json",
      "x-device-id": global.deviceId,
      Authorization: `Bearer ${token}`,
    }
  );

  const parsed = JSON.parse(body);

  if (parsed.success && parsed.data) {
    const { user, apiKey } = parsed.data;

    return {
      apiKey,
      email: user.email,
      username: user.name,
      userId: user._id,
      name: user.name,
      role: user.role,
    };
  }

  throw new Error(parsed.message || "Failed to verify Google token");
}

/**
 * Validates a secret key by checking the API status endpoint.
 *
 * @param {string} secretKey - The user's API secret key.
 * @returns {Promise<Object>} Validation result with user info or error message.
 */
async function checkUserID(secretKey) {
  if (!secretKey) {
    throw new Error("Secret key is not set");
  }

  const { statusCode, body } = await makeRequest(
    "GET",
    "/api/v1/app/appkey/stats",
    defaultHeaders(secretKey)
  );

  const parsed = JSON.parse(body);

  if (statusCode === 200 && parsed.success && parsed.data) {
    const { plan, username, status, user } = parsed.data;

    if ((!username && !user?.name) || !status) {
      return {
        isValid: false,
        message: "Invalid response format from API",
      };
    }

    return {
      isValid: true,
      username: username || user?.name || "User",
      email: user?.email || null,
      status,
      planType: "Premium",
      planId: plan?.id || null,
      expiresIn: null,
      expiresAt: null,
      credit: null,
      credits: Infinity,
      totalCredits: Infinity,
      aiApiKey: null,
      hasAiApiKey: false,
      isUnlimited: true,
    };
  }

  return {
    isValid: false,
    message: parsed.message || "Failed to validate secret key",
  };
}

module.exports = {
  isUserLoggedIn,
  saveAuthData,
  getAuthData,
  getStatus,
  checkApiStatus,
  verifyGoogleToken,
  checkUserID,
  handleGoogleLogin,
  loginWithEmailPassword,
};
