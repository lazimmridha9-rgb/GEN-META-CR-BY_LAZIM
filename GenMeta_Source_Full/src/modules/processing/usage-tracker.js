const { net } = require("electron");

const API_CONFIG = require("../../config/api");
const { loadSettings } = require("../settings");
const { getDeviceId } = require("./device");

/**
 * Global API usage tracker for the current processing session
 */
global.apiUsageTracker = {
  successfulBatches: 0,
  failedBatches: 0,
  processedFileCount: 0,
  failedErrors: [],
  isProcessing: false,

  /**
   * Track a successful batch
   * @param {number} [fileCount=0] - Number of files in the batch
   */
  trackSuccessfulBatch(fileCount = 0) {
    if (!this.isProcessing) return;
    this.successfulBatches++;
    this.processedFileCount += fileCount;
  },

  /**
   * Track a failed batch
   * @param {object[]} [errors=[]] - Array of error objects
   */
  trackFailedBatch(errors = []) {
    if (!this.isProcessing) return;
    this.failedBatches++;
    if (Array.isArray(errors) && errors.length > 0) {
      this.failedErrors.push(...errors);
    }
  },

  /** Start a new processing session, resetting counters */
  startSession() {
    this.isProcessing = true;
    this.successfulBatches = 0;
    this.failedBatches = 0;
    this.processedFileCount = 0;
    this.failedErrors = [];
  },

  /** End the session and report usage to the server */
  async endSession() {
    if (!this.isProcessing) return;
    this.isProcessing = false;

    const { successfulBatches, failedBatches, processedFileCount, failedErrors } =
      this;
    this.successfulBatches = 0;
    this.failedBatches = 0;
    this.processedFileCount = 0;
    this.failedErrors = [];

    if (successfulBatches > 0 || failedBatches > 0) {
      await apiUsage(
        successfulBatches,
        failedBatches,
        processedFileCount,
        failedErrors,
      );
    }
  },

  /** Reset all counters without reporting */
  reset() {
    this.successfulBatches = 0;
    this.failedBatches = 0;
    this.processedFileCount = 0;
    this.failedErrors = [];
    this.isProcessing = false;
  },
};

/**
 * Report API usage to the server
 * @param {number} [processCount=1] - Number of successful batches
 * @param {number} [failedCount=0] - Number of failed batches
 * @param {number} [processFileCount=0] - Total files processed
 * @param {object[]} [failedErrors=[]] - Error details from failed batches
 */
async function apiUsage(
  processCount = 1,
  failedCount = 0,
  processFileCount = 0,
  failedErrors = [],
) {
  const settings = loadSettings();
  const secretKey = settings.secretKey;

  if (!secretKey || (processCount < 1 && failedCount < 1)) return;

  try {
    const deviceId = getDeviceId();
    const request = net.request({
      method: "POST",
      protocol: API_CONFIG.protocol,
      port: API_CONFIG.port,
      hostname: API_CONFIG.hostname,
      path: "/api/v1/app/appkey/usage",
    });

    request.setHeader("x-api-key", secretKey);
    request.setHeader("x-device-id", deviceId);
    request.setHeader("Content-Type", "application/json");

    let responseData = "";

    await new Promise((resolve, reject) => {
      request.on("response", (response) => {
        response.on("data", (chunk) => {
          responseData += chunk.toString();
        });
        response.on("end", () => {
          resolve();
        });
      });
      request.on("error", (error) => {
        reject(error);
      });

      // Build request body
      const requestBody = {
        processCount: processCount || 0,
        processFileCount: processFileCount || 0,
      };

      if (failedCount > 0) {
        requestBody.failedCount = failedCount;
        if (Array.isArray(failedErrors) && failedErrors.length > 0) {
          requestBody.failedErrors = failedErrors
            .map((err, i) => {
              if (typeof err === "string") return `${i + 1}. ${err}`;
              if (err && err.error) return `${i + 1}. ${err.error}`;
              return `${i + 1}. Unknown error`;
            })
            .join(" | ");
        }
      }

      request.write(JSON.stringify(requestBody));
      request.end();
    });
  } catch (err) {
    console.warn("Unexpected error in apiUsage:", err.message);
  }
}

/**
 * Convenience wrapper to track a successful batch
 * @param {number} [fileCount=0]
 */
function trackSuccessfulBatch(fileCount = 0) {
  if (global.apiUsageTracker && global.apiUsageTracker.isProcessing) {
    global.apiUsageTracker.trackSuccessfulBatch(fileCount);
  }
}

/**
 * Convenience wrapper to track a failed batch
 * @param {object[]} [errors=[]]
 */
function trackFailedBatch(errors = []) {
  if (global.apiUsageTracker && global.apiUsageTracker.isProcessing) {
    global.apiUsageTracker.trackFailedBatch(errors);
  }
}

module.exports = { apiUsage, trackFailedBatch, trackSuccessfulBatch };
