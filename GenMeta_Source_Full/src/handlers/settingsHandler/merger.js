/**
 * Deep merges user settings with defaults, recursively handling nested objects
 * @param {Object} defaults - Default settings object
 * @param {Object} userSettings - User-provided settings
 * @returns {Object} Merged settings
 */
function deepMergeSettings(defaults, userSettings) {
  const result = { ...defaults };

  for (const key in userSettings) {
    if (Object.prototype.hasOwnProperty.call(userSettings, key)) {
      const userValue = userSettings[key];
      const defaultValue = defaults[key];

      // Recursively merge nested objects (not arrays)
      if (
        userValue && typeof userValue === 'object' && !Array.isArray(userValue) &&
        defaultValue && typeof defaultValue === 'object' && !Array.isArray(defaultValue)
      ) {
        result[key] = deepMergeSettings(defaultValue, userValue);
      } else {
        result[key] = userValue;
      }
    }
  }

  return result;
}

/**
 * Checks if user settings is missing any default fields (indicating new fields exist)
 * @param {Object} userSettings - User-provided settings
 * @param {Object} defaults - Default settings object
 * @returns {boolean} True if new fields exist in defaults that are missing from user settings
 */
function hasNewFields(userSettings, defaults) {
  for (const key in defaults) {
    if (!(key in userSettings)) return true;

    const userValue = userSettings[key];
    const defaultValue = defaults[key];

    // Recursively check nested objects
    if (
      userValue && typeof userValue === 'object' && !Array.isArray(userValue) &&
      defaultValue && typeof defaultValue === 'object' && !Array.isArray(defaultValue)
    ) {
      if (hasNewFields(userValue, defaultValue)) return true;
    }
  }

  return false;
}

/**
 * Migrates legacy settings fields to new format for backward compatibility
 * @param {Object} settings - Raw user settings
 * @param {Object} mergedSettings - Merged settings to update
 */
function migrateBackwardCompatibility(settings, mergedSettings) {
  // Migrate singleKeywordMode to keywordFormat
  if (settings.singleKeywordMode !== undefined && !settings.keywordFormat) {
    mergedSettings.keywordFormat = settings.singleKeywordMode ? 'single' : 'auto';
  }

  // Migrate addPeriod to separate title/description fields
  if (
    settings.addPeriod !== undefined &&
    settings.addPeriodTitle === undefined &&
    settings.addPeriodDescription === undefined
  ) {
    mergedSettings.addPeriodTitle = settings.addPeriod;
    mergedSettings.addPeriodDescription = settings.addPeriod;
  }
}

/**
 * Preserves managed settings fields that shouldn't be overwritten
 * @param {Object} settings - New settings being saved
 * @param {Object} currentSettings - Current settings on disk
 */
function preserveManagedSettings(settings, currentSettings) {
  if (!settings.gsPath && currentSettings.gsPath) {
    settings.gsPath = currentSettings.gsPath;
  }
}

module.exports = { deepMergeSettings, hasNewFields, migrateBackwardCompatibility, preserveManagedSettings };
