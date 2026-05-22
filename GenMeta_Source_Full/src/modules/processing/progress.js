const path = require("path");

const { app } = require("electron");

const logPath = path.join(app.getPath("userData"), "processing-log.txt");

/**
 * Log an error message to console and append to persistent log file
 * @param {string} message - Error message to log
 */
function logError(message) {
  console.error(message);
  try {
    require("fs").appendFileSync(
      logPath,
      `${new Date().toISOString()} - ${message}\n`,
      "utf8",
    );
  } catch (err) {
    console.error("Failed to write to log file:", err);
  }
}

/**
 * Track processing progress and notify the renderer
 */
const progressTracker = {
  total: 0,
  processed: 0,
  results: [],

  /** Reset all progress state */
  reset() {
    this.total = 0;
    this.processed = 0;
    this.results = [];
  },

  /**
   * Set total file count and notify renderer
   * @param {number} total - Total number of files to process
   */
  setTotal(total) {
    this.total = total;
    try {
      if (global.mainWindow && !global.mainWindow.isDestroyed()) {
        global.mainWindow.webContents.send("processing-start", { total });
      } else {
        logError("Cannot send processing-start: mainWindow not available");
      }
    } catch (err) {
      logError(`Error in setTotal: ${err.message}`);
    }
  },

  /** Increment processed count and notify renderer with progress stats */
  increment() {
    this.processed++;
    try {
      if (global.mainWindow && !global.mainWindow.isDestroyed()) {
        const successCount = this.results.filter(
          (r) => !r.error && r.status !== "cancelled",
        ).length;
        const failedCount = this.results.filter(
          (r) => r.error && r.status !== "cancelled",
        ).length;

        global.mainWindow.webContents.send("processing-progress", {
          current: this.processed,
          total: this.total,
          percent: Math.round((this.processed / this.total) * 100),
          successCount,
          failedCount,
        });
      } else {
        logError("Cannot send processing-progress: mainWindow not available");
      }
    } catch (err) {
      logError(`Error in increment: ${err.message}`);
    }
  },

  /**
   * Add a processing result and notify renderer
   * @param {object} result - Processing result object
   */
  addResult(result) {
    this.results.push(result);
    try {
      if (global.mainWindow && !global.mainWindow.isDestroyed()) {
        global.mainWindow.webContents.send("processing-result-item", result);
      } else {
        logError(
          "Cannot send processing-result-item: mainWindow not available",
        );
      }
    } catch (err) {
      logError(`Error in addResult: ${err.message}`);
    }
  },
};

module.exports = { logError, progressTracker };
