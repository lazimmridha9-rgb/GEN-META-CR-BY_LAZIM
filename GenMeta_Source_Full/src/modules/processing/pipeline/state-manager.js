/**
 * Centralized state manager for processing operations
 * Provides static methods to check and respond to stop requests
 */
class ProcessingStateManager {
  /**
   * Check if processing has been stopped
   * @returns {boolean} True if processing is stopped
   */
  static isProcessingStopped() {
    return global.processingState?.isProcessingStopped || false;
  }

  /**
   * Throw an error if processing has been stopped
   * @param {string} [context=""] - Optional context for the error message
   * @throws {Error} If processing is stopped
   */
  static checkAndThrowIfStopped(context = "") {
    if (this.isProcessingStopped()) {
      throw new Error(
        `Processing was stopped by user request${context ? ` (${context})` : ""}`,
      );
    }
  }

  /**
   * Create a cancelled result object
   * @param {string} filename - File name
   * @param {string} originalPath - Original file path
   * @returns {object} Cancelled result
   */
  static createCancelledResult(filename, originalPath) {
    return {
      filename,
      error: "Processing was stopped by user request",
      status: "cancelled",
      originalPath,
    };
  }
}

module.exports = ProcessingStateManager;
