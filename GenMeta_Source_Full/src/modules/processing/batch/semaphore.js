/**
 * Simple semaphore for controlling async concurrency
 */
class Semaphore {
  /**
   * @param {number} max - Maximum concurrent operations
   */
  constructor(max) {
    this.max = max;
    this.count = 0;
    this.queue = [];
  }

  /**
   * Acquire a semaphore slot, waiting if at capacity
   * @returns {Promise<Function>} Release function to call when done
   */
  async acquire() {
    if (this.count < this.max) {
      this.count++;
      return this._createRelease();
    }

    // Wait for a slot to become available
    return new Promise((resolve) => {
      this.queue.push(() => {
        this.count++;
        resolve(this._createRelease());
      });
    });
  }

  /**
   * Create a release function that decrements count and processes queue
   * @returns {Function} Release function
   */
  _createRelease() {
    return () => {
      this.count--;
      if (this.queue.length > 0) {
        const next = this.queue.shift();
        next();
      }
    };
  }
}

module.exports = { Semaphore };
