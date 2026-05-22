const { getDeviceId } = require("./device");
const { validateUserID } = require("./user-validator");
const { apiUsage, trackFailedBatch, trackSuccessfulBatch } = require("./usage-tracker");
const { registerProcessingHandlers } = require("./ipc");

// Initialize global processing state
global.processingState = { isProcessingStopped: false };

/**
 * Register all processing IPC handlers (alias for backward compatibility)
 */
function registerProcessingHandler() {
  registerProcessingHandlers();
}

module.exports = {
  apiUsage,
  getDeviceId,
  registerProcessingHandler,
  trackFailedBatch,
  trackSuccessfulBatch,
  validateUserID,
};
