const path = require('path');
const fs = require('fs');
const { app } = require('electron');

const LOG_PATH = path.join(app.getPath('userData'), 'processing-log.txt');

/**
 * Logs an error message to console and persistent log file
 * @param {string} message - Error message to log
 */
function logError(message) {
  console.error(message);
  try {
    fs.appendFileSync(LOG_PATH, `${new Date().toISOString()} - ${message}\n`, 'utf8');
  } catch (err) {
    console.error('Failed to write to log file:', err);
  }
}

/**
 * Tracks and reports processing progress to the renderer
 */
const progressTracker = {
  total: 0,
  processed: 0,
  results: [],

  reset() {
    this.total = 0;
    this.processed = 0;
    this.results = [];
  },

  setTotal(total) {
    this.total = total;
    try {
      if (global.mainWindow && !global.mainWindow.isDestroyed()) {
        global.mainWindow.webContents.send('processing-start', { total });
      } else {
        logError('Cannot send processing-start: mainWindow not available');
      }
    } catch (err) {
      logError(`Error in setTotal: ${err.message}`);
    }
  },

  increment() {
    this.processed++;
    try {
      if (global.mainWindow && !global.mainWindow.isDestroyed()) {
        const successCount = this.results.filter((r) => !r.error && r.status !== 'cancelled').length;
        const failedCount = this.results.filter((r) => r.error && r.status !== 'cancelled').length;

        global.mainWindow.webContents.send('processing-progress', {
          current: this.processed,
          total: this.total,
          percent: Math.round((this.processed / this.total) * 100),
          successCount,
          failedCount,
        });
      } else {
        logError('Cannot send processing-progress: mainWindow not available');
      }
    } catch (err) {
      logError(`Error in increment: ${err.message}`);
    }
  },

  addResult(result) {
    this.results.push(result);
    try {
      if (global.mainWindow && !global.mainWindow.isDestroyed()) {
        global.mainWindow.webContents.send('processing-result-item', result);
      } else {
        logError('Cannot send processing-result-item: mainWindow not available');
      }
    } catch (err) {
      logError(`Error in addResult: ${err.message}`);
    }
  },
};

module.exports = { progressTracker, logError };
