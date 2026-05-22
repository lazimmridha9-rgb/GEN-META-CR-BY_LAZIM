const path = require('path');

const APP_CONFIG = {
  TEMP_CLEANUP_DIRS: [
    'eps-conversion',
    'svg-conversion',
    'image-processing',
    'video-processing',
    'media-processing',
    'genmeta-results',
  ],
  API_STATUS_CHECK_INTERVAL: 10000,
  FORCE_CHECK_MIN_INTERVAL: 2000,
  SCHEDULED_API_CHECK_INTERVAL: 60 * 60 * 1000,
  INITIAL_UPDATE_CHECK_DELAY: 5000,
  SCHEDULED_UPDATE_CHECK_INTERVAL: 6 * 60 * 60 * 1000,
  WINDOW_FOCUS_CHECK_INTERVAL: 5000,
  AUTH_TIMEOUT: 5 * 60 * 1000,
};

module.exports = APP_CONFIG;
