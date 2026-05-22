/**
 * Manages the global processing stop state.
 * Provides static methods to check, throw on stop, and create cancelled results.
 */
class ProcessingStateManager {
  /**
   * Checks whether processing has been stopped globally.
   *
   * @returns {boolean} True if processing is stopped.
   */
  static isProcessingStopped() {
    return global.processingState?.isProcessingStopped || false;
  }

  /**
   * Throws an error if processing has been stopped.
   *
   * @param {string} [context=""] - Optional context description for the error message.
   * @throws {Error} If processing is stopped.
   */
  static checkAndThrowIfStopped(context = "") {
    if (this.isProcessingStopped()) {
      throw new Error(
        `Processing was stopped by user request${
          context ? ` (${context})` : ""
        }`
      );
    }
  }

  /**
   * Creates a cancelled result object for a file.
   *
   * @param {string} filename - The file name.
   * @param {string} originalPath - The original file path.
   * @returns {Object} A cancelled result object.
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
