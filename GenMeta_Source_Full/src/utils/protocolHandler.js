// Node modules
const { app } = require("electron");

// Local utils
const { logStartup } = require("./logStartup");

// Local services
const { verifyGoogleToken } = require("../services/authService");

/**
 * Handles incoming protocol URLs (genmeta://auth) for Google OAuth callbacks.
 *
 * @param {string} url - The full protocol URL to process.
 */
function handleProtocolUrl(url) {
  logStartup(`Handling protocol URL: ${url}`);

  try {
    const urlObj = new URL(url);

    // Only handle genmeta://auth URLs
    if (urlObj.protocol !== "genmeta:" || urlObj.hostname !== "auth") {
      return;
    }

    const searchParams = new URLSearchParams(urlObj.search);
    const state = searchParams.get("state");
    const token = searchParams.get("token");

    if (token) {
      // Verify the Google token with the backend
      verifyGoogleToken(token)
        .then((userData) => {
          resolvePendingAuth(state, {
            success: true,
            secretKey: userData.apiKey,
            email: userData.email,
            username: userData.username || userData.name,
            ...userData,
          });
          sendToWindow("google-auth-complete", {
            success: true,
            secretKey: userData.apiKey,
            email: userData.email,
            username: userData.username || userData.name,
            ...userData,
          });
        })
        .catch((error) => {
          logStartup(`Error verifying token: ${error.message}`);
          rejectPendingAuth(state, error);
          sendToWindow("google-auth-complete", {
            success: false,
            error: error.message,
          });
        });
    } else if (state && global.pendingGoogleAuth && global.pendingGoogleAuth.state === state) {
      rejectPendingAuth(state, new Error("Authentication failed: No token received"));
    }
  } catch (error) {
    logStartup(`Error parsing URL: ${error.message}`);

    // Reject any pending auth with the error
    if (global.pendingGoogleAuth) {
      const { reject, timeoutId } = global.pendingGoogleAuth;
      global.pendingGoogleAuth = null;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      reject(new Error(`Authentication failed: ${error.message}`));
    }
  }
}

/**
 * Resolves a pending Google auth promise with the given result.
 *
 * @param {string} state - The OAuth state token to match.
 * @param {Object} result - The authentication result.
 */
function resolvePendingAuth(state, result) {
  if (global.pendingGoogleAuth && global.pendingGoogleAuth.state === state) {
    if (global.pendingGoogleAuth.timeoutId) {
      clearTimeout(global.pendingGoogleAuth.timeoutId);
    }
    const { resolve } = global.pendingGoogleAuth;
    global.pendingGoogleAuth = null;
    resolve(result);
  }
}

/**
 * Rejects a pending Google auth promise with the given error.
 *
 * @param {string} state - The OAuth state token to match.
 * @param {Error} error - The error to reject with.
 */
function rejectPendingAuth(state, error) {
  if (global.pendingGoogleAuth && global.pendingGoogleAuth.state === state) {
    if (global.pendingGoogleAuth.timeoutId) {
      clearTimeout(global.pendingGoogleAuth.timeoutId);
    }
    const { reject } = global.pendingGoogleAuth;
    global.pendingGoogleAuth = null;
    reject(error);
  }
}

/**
 * Sends data to the main window via IPC, restoring and focusing if minimized.
 *
 * @param {string} channel - The IPC channel name.
 * @param {Object} data - The data to send.
 */
function sendToWindow(channel, data) {
  if (global.mainWindow && !global.mainWindow.isDestroyed()) {
    global.mainWindow.webContents.send(channel, data);

    if (global.mainWindow.isMinimized()) {
      global.mainWindow.restore();
    }
    global.mainWindow.focus();
  }
}

/**
 * Registers the genmeta:// protocol client with the OS.
 */
function setupProtocolClient() {
  if (process.defaultApp) {
    // Development mode: register with electron executable and script path
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient(
        "genmeta",
        process.execPath,
        [require("path").resolve(process.argv[1])]
      );
    }
  } else {
    // Production mode: register with the packaged app
    app.setAsDefaultProtocolClient("genmeta");
  }
}

module.exports = { handleProtocolUrl, setupProtocolClient };
