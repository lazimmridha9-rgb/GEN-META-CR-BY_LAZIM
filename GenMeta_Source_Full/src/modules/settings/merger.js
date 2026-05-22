/**
 * Deep merge user settings over defaults, recursively merging nested objects
 * @param {object} defaults - Default settings object
 * @param {object} userSettings - User-provided settings
 * @returns {object} Merged settings
 */
function deepMergeSettings(defaults, userSettings) {
  const result = { ...defaults };

  for (const key in userSettings) {
    if (Object.prototype.hasOwnProperty.call(userSettings, key)) {
      const userValue = userSettings[key];
      const defaultValue = defaults[key];

      // Recursively merge nested objects (but not arrays)
      if (
        userValue &&
        typeof userValue === "object" &&
        !Array.isArray(userValue) &&
        defaultValue &&
        typeof defaultValue === "object" &&
        !Array.isArray(defaultValue)
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
 * Check if defaults contain any fields not present in user settings
 * @param {object} userSettings - User-provided settings
 * @param {object} defaults - Default settings
 * @returns {boolean} True if new fields exist
 */
function hasNewFields(userSettings, defaults) {
  for (const key in defaults) {
    if (!(key in userSettings)) return true;

    const userValue = userSettings[key];
    const defaultValue = defaults[key];

    if (
      userValue &&
      typeof userValue === "object" &&
      !Array.isArray(userValue) &&
      defaultValue &&
      typeof defaultValue === "object" &&
      !Array.isArray(defaultValue)
    ) {
      if (hasNewFields(userValue, defaultValue)) return true;
    }
  }

  return false;
}

/**
 * Migrate old settings fields to new format for backward compatibility
 * @param {object} settings - Original user settings
 * @param {object} mergedSettings - Merged settings to update
 */
function migrateBackwardCompatibility(settings, mergedSettings) {
  // Migrate singleKeywordMode to keywordFormat
  if (settings.singleKeywordMode !== undefined && !settings.keywordFormat) {
    mergedSettings.keywordFormat = settings.singleKeywordMode ? "single" : "auto";
  }

  // Migrate addPeriod to separate title/description flags
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
 * Preserve settings that should not be overwritten during save
 * @param {object} settings - New settings being saved
 * @param {object} currentSettings - Current settings on disk
 */
function preserveManagedSettings(settings, currentSettings) {
  if (!settings.gsPath && currentSettings.gsPath) {
    settings.gsPath = currentSettings.gsPath;
  }
}

module.exports = { deepMergeSettings, hasNewFields, migrateBackwardCompatibility, preserveManagedSettings };
