const { ipcMain, app } = require('electron');
const fs = require('fs');
const path = require('path');
const { DEFAULT_SETTINGS } = require('./defaults');
const {
  deepMergeSettings,
  hasNewFields,
  migrateBackwardCompatibility,
  preserveManagedSettings,
} = require('./merger');
const { getProcessingApiKey } = require('./apiKeyUtils');

const SETTINGS_PATH = path.join(app.getPath('userData'), 'settings.json');

/**
 * Loads authentication data from auth.json
 * @returns {{ secretKey: string }} Auth data object
 */
function getAuthData() {
  const authPath = path.join(app.getPath('userData'), 'auth.json');
  try {
    if (fs.existsSync(authPath)) {
      return JSON.parse(fs.readFileSync(authPath, 'utf8'));
    }
  } catch (err) {
    console.error('Error loading auth data:', err.message);
  }
  return { secretKey: '' };
}

/**
 * Ensures settings has a secretKey from auth data if missing
 * @param {Object} settings - Settings object to update
 * @returns {Object} Updated settings
 */
function ensureSecretKey(settings) {
  if (!settings.secretKey) {
    settings.secretKey = getAuthData().secretKey || '';
  }
  return settings;
}

/**
 * Auto-detects and saves Ghostscript path if not configured
 * @param {Object} mergedSettings - Merged settings object
 */
async function autoDetectGhostscriptPath(mergedSettings) {
  if (mergedSettings.gsPath) return;

  try {
    const { findGhostscriptPath } = require('../../utils/ghostscriptInstaller');
    const gsPath = await findGhostscriptPath();
    if (gsPath) {
      mergedSettings.gsPath = gsPath;
      saveSettings(mergedSettings);
    }
  } catch (err) {
    console.error(`Error finding Ghostscript path: ${err.message}`);
  }
}

/**
 * Loads settings from disk, merging with defaults and migrating as needed
 * @returns {Object} Complete settings object
 */
function loadSettings() {
  try {
    if (!fs.existsSync(SETTINGS_PATH)) {
      return ensureSecretKey({ ...DEFAULT_SETTINGS });
    }

    const rawSettings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
    const mergedSettings = deepMergeSettings(DEFAULT_SETTINGS, rawSettings);

    // Apply backward compatibility migrations
    migrateBackwardCompatibility(rawSettings, mergedSettings);
    ensureSecretKey(mergedSettings);

    // Auto-detect Ghostscript path (async, non-blocking)
    autoDetectGhostscriptPath(mergedSettings);

    // Persist if new fields were added
    if (hasNewFields(rawSettings, DEFAULT_SETTINGS)) {
      fs.writeFileSync(SETTINGS_PATH, JSON.stringify(mergedSettings, null, 2));
    }

    return mergedSettings;
  } catch (err) {
    console.error('Error loading settings:', err);
    return ensureSecretKey({ ...DEFAULT_SETTINGS });
  }
}

/**
 * Saves authentication data to auth.json
 * @param {string} secretKey - The secret key to save
 */
function saveAuthData(secretKey) {
  const authPath = path.join(app.getPath('userData'), 'auth.json');
  try {
    fs.writeFileSync(authPath, JSON.stringify({ secretKey }, null, 2));
  } catch (err) {
    console.error('Error saving auth data:', err);
  }
}

/**
 * Saves settings to disk, preserving managed fields
 * @param {Object} settings - Settings to save
 * @returns {boolean} Whether save was successful
 */
function saveSettings(settings) {
  try {
    const currentSettings = loadSettings();
    preserveManagedSettings(settings, currentSettings);

    // Sync secretKey with auth data
    if (!settings.secretKey) {
      settings.secretKey = getAuthData().secretKey || '';
    } else {
      saveAuthData(settings.secretKey);
    }

    const completeSettings = deepMergeSettings(DEFAULT_SETTINGS, settings);
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(completeSettings, null, 2));
    return true;
  } catch (err) {
    console.error('Error saving settings:', err);
    return false;
  }
}

/**
 * Registers settings-related IPC handlers
 */
function registerSettingsHandlers() {
  ipcMain.handle('load-settings', async () => loadSettings());

  ipcMain.handle('save-settings', async (event, settings) => saveSettings(settings));

  ipcMain.handle('get-processing-api-key', async (event, planType, aiAgent = 'gemini') => {
    const settings = loadSettings();
    return getProcessingApiKey(settings, planType, null, aiAgent);
  });
}

module.exports = { registerSettingsHandlers, loadSettings, getProcessingApiKey };
