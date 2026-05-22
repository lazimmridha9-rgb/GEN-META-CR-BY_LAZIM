const { shell } = require("electron");
const path = require("path");

const API_CONFIG = require("../../config/api");
const APP_CONFIG = require("../../config/app");
const { logStartup } = require("../../utils/logStartup");
const { defaultHeaders, makeRequest } = require("./client");

/**
 * Initiate Google OAuth login flow via external browser
 * @returns {Promise<object>} Auth result with secretKey and user info
 */
async function handleGoogleLogin() {
  return new Promise((resolve, reject) => {
    logStartup("Starting Google login flow in browser");

    // Generate random state for CSRF protection
    const state = Math.random().toString(36).substring(2, 15);
    global.pendingGoogleAuth = { state, resolve, reject };

    // Set timeout for auth flow
    const timeoutId = setTimeout(() => {
      if (global.pendingGoogleAuth && global.pendingGoogleAuth.state === state) {
        logStartup("Google login timed out");
        const { reject } = global.pendingGoogleAuth;
        global.pendingGoogleAuth = null;
        reject(new Error("Authentication timed out. Please try again."));
      }
    }, APP_CONFIG.AUTH_TIMEOUT);

    global.pendingGoogleAuth.timeoutId = timeoutId;

    const googleAuthUrl = `${API_CONFIG.baseUrl}/api/v1/users/google-login?state=${state}&type=app&callback=genmeta://auth`;
    shell.openExternal(googleAuthUrl).catch(err => {
      logStartup(`Failed to open browser: ${err.message}`);
      clearTimeout(timeoutId);
      global.pendingGoogleAuth = null;
      reject(new Error(`Could not open browser. Please check your default browser settings.\n${err.message}`));
    });
  });
}

/**
 * Login with email and password credentials
 * @param {string} email User email
 * @param {string} password User password
 * @returns {Promise<{success: boolean, secretKey: string, user: object}>} Login result
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
      { email, password },
    );

    const parsed = JSON.parse(body);

    if (statusCode >= 200 && statusCode < 300 && parsed.success) {
      logStartup("Email login successful");
      const { apiKey, user } = parsed.data;
      if (!apiKey) throw new Error("Failed to login");
      return { success: true, secretKey: apiKey, user };
    }

    throw new Error(parsed.message || "Invalid email or password");
  } catch (err) {
    // Re-throw network/parse errors as-is
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
