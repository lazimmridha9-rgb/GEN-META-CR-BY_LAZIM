const path = require('path');
const fs = require('fs');
const { app, BrowserWindow } = require('electron');
const { logStartup } = require('../../utils/logStartup');
const { isUserLoggedIn, checkApiStatus } = require('../../modules/auth');
const { isGuestLoggedIn, getGuestInfo } = require('../../services/guestAuthService');
const { checkForUpdates } = require('../../services/updateService');
const APP_CONFIG = require('../../config/app');

/**
 * Checks Ghostscript installation and saves path if found
 */
async function checkGhostscriptOnStartup() {
  try {
    const { isGhostscriptInstalled } = require('../../utils/ghostscriptInstaller');
    const result = await isGhostscriptInstalled();

    if (result.installed) {
      logStartup(`Found Ghostscript ${result.version} at: ${result.path}`);
      if (result.functional === false) {
        logStartup('Warning: Ghostscript installation may not be functioning correctly');
      }

      // Save path to settings if not already configured
      const settingsPath = path.join(app.getPath('userData'), 'settings.json');
      try {
        let settings = {};
        if (fs.existsSync(settingsPath)) {
          settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        }
        if (!settings.gsPath) {
          settings.gsPath = result.path;
          fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
          logStartup(`Saved Ghostscript path to settings: ${result.path}`);
        }
      } catch (e) {
        logStartup(`Error saving Ghostscript path to settings: ${e.message}`);
      }
    } else {
      logStartup('Ghostscript not found. It will be offered for installation if EPS files need to be processed.');
    }
  } catch (error) {
    logStartup(`Error checking for Ghostscript: ${error.message}`);
  }
}

/**
 * Tests FFmpeg installation and logs result
 */
async function checkFFmpegOnStartup() {
  try {
    const { testFFmpegInstallation } = require('../../modules/media/video/compressor');
    const result = await testFFmpegInstallation();

    if (result.success) {
      logStartup(`FFmpeg is working correctly: ${result.version}`);
    } else {
      logStartup(`FFmpeg test failed: ${result.message}`);
    }
  } catch (error) {
    logStartup(`Error testing FFmpeg: ${error.message}`);
  }
}

/**
 * Schedules periodic update and API status checks
 * @param {BrowserWindow} mainWindow - Main application window
 */
function schedulePeriodicChecks(mainWindow) {
  // Initial update check after delay
  setTimeout(() => {
    logStartup('Running initial update check');
    checkForUpdates();

    // Schedule recurring update checks
    setInterval(() => {
      logStartup('Running scheduled update check');
      checkForUpdates();
    }, APP_CONFIG.SCHEDULED_UPDATE_CHECK_INTERVAL);
  }, APP_CONFIG.INITIAL_UPDATE_CHECK_DELAY);

  // Schedule recurring API status checks for logged-in users (skip for guests)
  setInterval(() => {
    if (isUserLoggedIn() && !isGuestLoggedIn()) {
      checkApiStatus();
    }
  }, APP_CONFIG.SCHEDULED_API_CHECK_INTERVAL);
}

/**
 * Performs all startup checks (Ghostscript, FFmpeg, API status)
 * @param {BrowserWindow} mainWindow - Main application window
 */
async function performStartupChecks(mainWindow) {
  await checkGhostscriptOnStartup();
  await checkFFmpegOnStartup();

  const loggedIn = isUserLoggedIn();
  const guestLoggedIn = isGuestLoggedIn();
  if (loggedIn) {
    const status = await checkApiStatus(true);
    if (mainWindow && !mainWindow.isDestroyed() && status) {
      mainWindow.webContents.send('login-status', {
        isLoggedIn: true,
        apiStatus: status,
      });
    }
  } else if (guestLoggedIn) {
    // Guest session persists - notify renderer
    const guestInfo = getGuestInfo();
    mainWindow.webContents.send('login-status', {
      isLoggedIn: true,
      isGuest: true,
      username: guestInfo?.guestName || 'Guest User',
    });
  } else {
    logStartup('Skipping API status check - user not logged in');
  }
}

module.exports = {
  performStartupChecks,
  schedulePeriodicChecks,
};
