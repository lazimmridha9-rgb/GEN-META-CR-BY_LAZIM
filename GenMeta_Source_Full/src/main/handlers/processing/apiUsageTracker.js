const { loadSettings } = require('../../../handlers/settingsHandler');
const API_CONFIG = require('../../../config/api');
const { getDeviceId } = require('./deviceManager');
const { net } = require('electron');

/**
 * Reports API usage statistics to the server
 * @param {number} processCount - Number of successful batches
 * @param {number} failedCount - Number of failed batches
 * @param {number} processFileCount - Total files processed
 * @param {Array} failedErrors - Array of error messages from failed batches
 */
async function apiUsage(processCount = 1, failedCount = 0, processFileCount = 0, failedErrors = []) {
  const settings = loadSettings();
  const secretKey = settings.secretKey;

  if (!secretKey || (processCount < 1 && failedCount < 1)) return;

  try {
    const deviceId = getDeviceId();
    const request = net.request({
      method: 'POST',
      protocol: API_CONFIG.protocol,
      port: API_CONFIG.port,
      hostname: API_CONFIG.hostname,
      path: '/api/v1/app/appkey/usage',
    });

    request.setHeader('x-api-key', secretKey);
    request.setHeader('x-device-id', deviceId);
    request.setHeader('Content-Type', 'application/json');

    let responseData = '';

    await new Promise((resolve, reject) => {
      request.on('response', (response) => {
        response.on('data', (chunk) => { responseData += chunk.toString(); });
        response.on('end', () => { resolve(); });
      });
      request.on('error', (error) => { reject(error); });

      const requestBody = {
        processCount: processCount || 0,
        processFileCount: processFileCount || 0,
      };

      if (failedCount > 0) {
        requestBody.failedCount = failedCount;
        if (Array.isArray(failedErrors) && failedErrors.length > 0) {
          requestBody.failedErrors = failedErrors.map((err, i) => {
            if (typeof err === 'string') return `${i + 1}. ${err}`;
            if (err && err.error) return `${i + 1}. ${err.error}`;
            return `${i + 1}. Unknown error`;
          }).join(' | ');
        }
      }

      request.write(JSON.stringify(requestBody));
      request.end();
    });
  } catch (err) {
    console.warn('Unexpected error in apiUsage:', err.message);
  }
}

/**
 * Tracks and reports API usage for processing sessions
 */
const apiUsageTracker = {
  successfulBatches: 0,
  failedBatches: 0,
  processedFileCount: 0,
  failedErrors: [],
  isProcessing: false,

  trackSuccessfulBatch(fileCount = 0) {
    if (!this.isProcessing) return;
    this.successfulBatches++;
    this.processedFileCount += fileCount;
  },

  trackFailedBatch(errors = []) {
    if (!this.isProcessing) return;
    this.failedBatches++;
    if (Array.isArray(errors) && errors.length > 0) {
      this.failedErrors.push(...errors);
    }
  },

  startSession() {
    this.isProcessing = true;
    this.successfulBatches = 0;
    this.failedBatches = 0;
    this.processedFileCount = 0;
    this.failedErrors = [];
  },

  async endSession() {
    if (!this.isProcessing) return;
    this.isProcessing = false;

    const { successfulBatches, failedBatches, processedFileCount, failedErrors } = this;

    // Reset counters
    this.successfulBatches = 0;
    this.failedBatches = 0;
    this.processedFileCount = 0;
    this.failedErrors = [];

    // Report usage if any activity occurred
    if (successfulBatches > 0 || failedBatches > 0) {
      await apiUsage(successfulBatches, failedBatches, processedFileCount, failedErrors);
    }
  },

  reset() {
    this.successfulBatches = 0;
    this.failedBatches = 0;
    this.processedFileCount = 0;
    this.failedErrors = [];
    this.isProcessing = false;
  },
};

// Expose tracker on global for cross-module access
global.apiUsageTracker = apiUsageTracker;

/**
 * Convenience wrapper for tracking successful batches
 * @param {number} fileCount - Number of files in the batch
 */
function trackSuccessfulBatch(fileCount = 0) {
  if (global.apiUsageTracker && global.apiUsageTracker.isProcessing) {
    global.apiUsageTracker.trackSuccessfulBatch(fileCount);
  }
}

/**
 * Convenience wrapper for tracking failed batches
 * @param {Array} errors - Array of error messages
 */
function trackFailedBatch(errors = []) {
  if (global.apiUsageTracker && global.apiUsageTracker.isProcessing) {
    global.apiUsageTracker.trackFailedBatch(errors);
  }
}

module.exports = { apiUsage, trackSuccessfulBatch, trackFailedBatch };
