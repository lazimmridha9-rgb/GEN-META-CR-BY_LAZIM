const { getDeviceId } = require('./deviceManager');
const { validateUserID } = require('./userValidator');
const { apiUsage, trackSuccessfulBatch, trackFailedBatch } = require('./apiUsageTracker');
const { registerProcessingHandlers } = require('./index');

// Initialize global processing state
global.processingState = { isProcessingStopped: false };

/**
 * Registers all processing-related IPC handlers
 */
function registerProcessingHandler() {
  registerProcessingHandlers();
}

module.exports = {
  registerProcessingHandler,
  validateUserID,
  apiUsage,
  trackSuccessfulBatch,
  trackFailedBatch,
  getDeviceId,
};
