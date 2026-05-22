const { app } = require('electron');
const path = require('path');
const { logStartup } = require('../utils/logStartup');
const { verifyGoogleToken } = require('../modules/auth');

/**
 * Resolves a pending Google authentication promise
 * @param {string} state - Auth state identifier
 * @param {Object} result - Authentication result data
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
 * Rejects a pending Google authentication promise
 * @param {string} state - Auth state identifier
 * @param {Error} error - Error to reject with
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
 * Sends data to the main window via IPC
 * @param {string} channel - IPC channel name
 * @param {Object} data - Data to send
 */
function sendToWindow(channel, data) {
  if (global.mainWindow && !global.mainWindow.isDestroyed()) {
    global.mainWindow.webContents.send(channel, data);
    if (global.mainWindow.isMinimized()) global.mainWindow.restore();
    global.mainWindow.focus();
  }
}

/**
 * Handles incoming protocol URLs for OAuth callbacks
 * @param {string} url - The protocol URL to handle
 */
function handleProtocolUrl(url) {
  logStartup(`Handling protocol URL: ${url}`);

  try {
    const urlObj = new URL(url);

    if (urlObj.protocol !== 'genmeta:' || urlObj.hostname !== 'auth') return;

    const searchParams = new URLSearchParams(urlObj.search);
    const state = searchParams.get('state');
    const token = searchParams.get('token');

    if (token) {
      verifyGoogleToken(token)
        .then((userData) => {
          const authResult = {
            success: true,
            secretKey: userData.apiKey,
            email: userData.email,
            username: userData.username || userData.name,
            ...userData,
          };
          resolvePendingAuth(state, authResult);
          sendToWindow('google-auth-complete', authResult);
        })
        .catch((error) => {
          logStartup(`Error verifying token: ${error.message}`);
          rejectPendingAuth(state, error);
          sendToWindow('google-auth-complete', { success: false, error: error.message });
        });
    } else if (state && global.pendingGoogleAuth && global.pendingGoogleAuth.state === state) {
      rejectPendingAuth(state, new Error('Authentication failed: No token received'));
    }
  } catch (error) {
    logStartup(`Error parsing URL: ${error.message}`);

    if (global.pendingGoogleAuth) {
      const { reject, timeoutId } = global.pendingGoogleAuth;
      global.pendingGoogleAuth = null;
      if (timeoutId) clearTimeout(timeoutId);
      reject(new Error(`Authentication failed: ${error.message}`));
    }
  }
}

/**
 * Registers the genmeta:// protocol handler
 */
function setupProtocolClient() {
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient('genmeta', process.execPath, [path.resolve(process.argv[1])]);
    }
  } else {
    app.setAsDefaultProtocolClient('genmeta');
  }
}

module.exports = { handleProtocolUrl, setupProtocolClient };
