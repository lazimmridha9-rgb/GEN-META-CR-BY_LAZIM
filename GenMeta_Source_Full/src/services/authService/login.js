// Node modules
const { shell, app } = require("electron");
const fs = require("fs");
const path = require("path");

// Local config
const API_CONFIG = require("../../config/api");
const APP_CONFIG = require("../../config/app");

// Local utils
const { logStartup } = require("../../utils/logStartup");

// Local modules
const { makeRequest, defaultHeaders } = require("./apiClient");

/**
 * Initiates the Google login flow by opening a browser window.
 * Returns a promise that resolves with the auth result or rejects on failure.
 *
 * @returns {Promise<Object>} The authentication result.
 */
async function handleGoogleLogin() {
  return new Promise((resolve, reject) => {
    logStartup("Starting Google login flow in browser");

    // Generate a random state token for the OAuth flow
    const state = Math.random().toString(36).substring(2, 15);
    global.pendingGoogleAuth = { state, resolve, reject };

    // Set a timeout to prevent hanging auth flows
    const timeoutId = setTimeout(() => {
      if (global.pendingGoogleAuth && global.pendingGoogleAuth.state === state) {
        logStartup("Google login timed out");
        const { reject } = global.pendingGoogleAuth;
        global.pendingGoogleAuth = null;
        reject(new Error("Authentication timed out. Please try again."));
      }
    }, APP_CONFIG.AUTH_TIMEOUT);

    global.pendingGoogleAuth.timeoutId = timeoutId;

    // Open the Google login URL in the default browser
    const googleAuthUrl =
      `${API_CONFIG.baseUrl}/api/v1/users/google-login` +
      `?state=${state}&type=app&callback=genmeta://auth`;
    shell.openExternal(googleAuthUrl).catch(err => {
      logStartup(`Failed to open browser: ${err.message}`);
      clearTimeout(timeoutId);
      global.pendingGoogleAuth = null;
      reject(new Error(`Could not open browser. Please check your default browser settings.\n${err.message}`));
    });
  });
}

/**
 * Authenticates a user with email and password.
 *
 * @param {string} email - The user's email address.
 * @param {string} password - The user's password.
 * @returns {Promise<Object>} Login result with secretKey and user data.
 */
async function loginWithEmailPassword(email, password) {
  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  logStartup(`Attempting email login for: ${email}`);

  try {
    const { statusCode, body } = await makeRequest(
      "POST",
      "/api/v1/users/app/login",
      {
        "Content-Type": "application/json",
        "x-device-id": global.deviceId,
      },
      { email, password }
    );

    const parsed = JSON.parse(body);

    if (statusCode >= 200 && statusCode < 300 && parsed.success) {
      logStartup("Email login successful");
      const { apiKey, user } = parsed.data;

      if (!apiKey) {
        throw new Error("Failed to login");
      }

      return { success: true, secretKey: apiKey, user };
    }

    throw new Error(parsed.message || "Invalid email or password");
  } catch (err) {
    // Re-throw network/parse errors without additional logging
    if (
      err.message.startsWith("Failed to parse") ||
      err.message.startsWith("Login request")
    ) {
      throw err;
    }

    logStartup(`Email login failed: ${err.message}`);
    throw err;
  }
}

module.exports = { handleGoogleLogin, loginWithEmailPassword };
