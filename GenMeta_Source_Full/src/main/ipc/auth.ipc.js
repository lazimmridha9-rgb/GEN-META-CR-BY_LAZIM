const { ipcMain, app } = require('electron');
const fs = require('fs');
const path = require('path');
const { logStartup } = require('../../utils/logStartup');
const {
  isUserLoggedIn,
  saveAuthData,
  getAuthData,
  checkUserID,
  checkApiStatus,
  handleGoogleLogin,
  loginWithEmailPassword,
} = require('../../modules/auth');
const {
  loginAsGuest,
  logoutGuest,
  isGuestLoggedIn,
  getGuestInfo,
} = require('../../services/guestAuthService');

/**
 * Checks if user is logged in (regular or guest)
 * @returns {boolean} True if logged in
 */
function checkIsLoggedIn() {
  return isUserLoggedIn() || isGuestLoggedIn();
}

/**
 * Saves the secret key to settings.json
 * @param {string} secretKey - The authentication secret key
 */
function saveSecretKeyToSettings(secretKey) {
  const settingsPath = path.join(app.getPath('userData'), 'settings.json');
  let settings = {};
  try {
    if (fs.existsSync(settingsPath)) {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    }
    settings.secretKey = secretKey;
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  } catch (err) {
    logStartup(`Error updating settings with secret key: ${err.message}`);
  }
}

/**
 * Sends login status to the renderer process
 * @param {Object} statusData - The login status data to send
 */
function sendLoginStatus(statusData) {
  if (global.mainWindow && !global.mainWindow.isDestroyed()) {
    global.mainWindow.webContents.send('login-status', statusData);
  }
}

/**
 * Registers authentication-related IPC handlers
 */
function registerAuthHandlers() {
  ipcMain.handle('check-login-status', () => {
    const loggedIn = isUserLoggedIn();
    const guestLoggedIn = isGuestLoggedIn();
    logStartup(`Login status check: ${loggedIn ? 'logged in' : guestLoggedIn ? 'guest logged in' : 'not logged in'}`);
    return loggedIn || guestLoggedIn;
  });

  // Check if guest session is active
  ipcMain.handle('check-guest-session', () => {
    return isGuestLoggedIn();
  });

  // Get guest session info
  ipcMain.handle('get-guest-info', () => {
    return getGuestInfo();
  });

  // Email/password login handler
  ipcMain.handle('login', async (event, credentials) => {
    logStartup('Handling login request');

    if (!credentials.email || !credentials.password) {
      return { success: false, message: 'Either email/password or secret key is required' };
    }

    try {
      const loginResult = await loginWithEmailPassword(credentials.email, credentials.password);

      if (!loginResult.success || !loginResult.secretKey) {
        return { success: false, message: 'Email login failed' };
      }

      const secretKey = loginResult.secretKey;
      const result = await checkUserID(secretKey);

      if (!result.isValid) {
        return { success: false, message: result.message || 'Invalid secret key' };
      }

      // Save auth data and update settings
      saveAuthData(secretKey);
      saveSecretKeyToSettings(secretKey);

      // Notify renderer of successful login
      sendLoginStatus({ isLoggedIn: true });

      // Check API status and send updated status
      try {
        const status = await checkApiStatus(true);
        if (status) {
          sendLoginStatus({ isLoggedIn: true, apiStatus: status });
        }
      } catch (statusError) {
        logStartup(`Error checking API status after login: ${statusError.message}`);
      }

      return {
        success: true,
        message: 'Login successful',
        username: result.username || loginResult.user?.name || 'User',
      };
    } catch (error) {
      logStartup(`Email login error: ${error.message}`);
      return { success: false, message: error.message || 'Email login failed' };
    }
  });

  // Google OAuth login handler
  ipcMain.handle('google-login', async () => {
    try {
      const result = await handleGoogleLogin();

      if (!result.success) {
        return { success: false, message: result.message || 'Google login failed' };
      }

      // Save auth data and update settings
      saveAuthData(result.secretKey);

      const settingsPath = path.join(app.getPath('userData'), 'settings.json');
      let settings = {};
      try {
        if (fs.existsSync(settingsPath)) {
          settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        }
        settings.secretKey = result.secretKey;
        settings.email = result.email;
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
      } catch (err) {
        logStartup(`Error updating settings with Google login: ${err.message}`);
      }

      // Notify renderer of successful login
      sendLoginStatus({ isLoggedIn: true });

      // Check API status and send updated status
      try {
        const status = await checkApiStatus(true);
        if (status) {
          sendLoginStatus({ isLoggedIn: true, apiStatus: status });
        }
      } catch (statusError) {
        logStartup(`Error checking API status after Google login: ${statusError.message}`);
      }

      return {
        success: true,
        message: 'Google login successful',
        username: result.username || result.email.split('@')[0],
      };
    } catch (error) {
      logStartup(`Google login error: ${error.message}`);
      return { success: false, message: error.message || 'Google login failed' };
    }
  });

  // Guest login handler - no server/API call required
  ipcMain.handle('guest-login', async () => {
    logStartup('Handling guest login request');

    try {
      const result = loginAsGuest();

      if (!result.success) {
        return { success: false, message: result.message || 'Guest login failed' };
      }

      // Notify renderer of successful guest login
      sendLoginStatus({ isLoggedIn: true, isGuest: true, username: result.username });

      return {
        success: true,
        message: 'Guest login successful',
        username: result.username,
        isGuest: true,
        guestId: result.guestId,
        planType: 'Premium',
        credits: Infinity,
        isUnlimited: true,
      };
    } catch (error) {
      logStartup(`Guest login error: ${error.message}`);
      return { success: false, message: error.message || 'Guest login failed' };
    }
  });

  // Guest logout handler
  ipcMain.handle('guest-logout', () => {
    logStartup('Handling guest logout request');

    try {
      const result = logoutGuest();

      // Also clear regular auth data if exists
      const authPath = path.join(app.getPath('userData'), 'auth.json');
      if (fs.existsSync(authPath)) {
        fs.unlinkSync(authPath);
      }

      // Clear secret key from settings
      const settingsPath = path.join(app.getPath('userData'), 'settings.json');
      if (fs.existsSync(settingsPath)) {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        settings.secretKey = '';
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
      }

      // Notify renderer of logout
      sendLoginStatus({ isLoggedIn: false });

      return result;
    } catch (err) {
      logStartup(`Error during guest logout: ${err.message}`);
      return { success: false, message: err.message };
    }
  });

  // Logout handler
  ipcMain.handle('logout', () => {
    logStartup('Handling logout request');
    const authPath = path.join(app.getPath('userData'), 'auth.json');

    try {
      // Remove auth file
      if (fs.existsSync(authPath)) {
        fs.unlinkSync(authPath);
      }

      // Also clear guest auth data if exists
      const guestAuthPath = path.join(app.getPath('userData'), 'guest-auth.json');
      if (fs.existsSync(guestAuthPath)) {
        fs.unlinkSync(guestAuthPath);
      }

      // Clear secret key from settings
      const settingsPath = path.join(app.getPath('userData'), 'settings.json');
      if (fs.existsSync(settingsPath)) {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        settings.secretKey = '';
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
      }

      // Notify renderer of logout
      sendLoginStatus({ isLoggedIn: false });

      return { success: true };
    } catch (err) {
      logStartup(`Error during logout: ${err.message}`);
      return { success: false, message: err.message };
    }
  });
}

module.exports = { registerAuthHandlers };
