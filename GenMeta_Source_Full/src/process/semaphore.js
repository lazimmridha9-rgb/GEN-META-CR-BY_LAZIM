/**
 * A simple semaphore implementation for controlling concurrency.
 * Limits the number of concurrent operations to a specified maximum.
 */
class Semaphore {
  /**
   * Creates a new Semaphore instance.
   *
   * @param {number} max - The maximum number of concurrent operations allowed.
   */
  constructor(max) {
    this.max = max;
    this.count = 0;
    this.queue = [];
  }

  /**
   * Acquires a permit from the semaphore. If the maximum is reached,
   * the caller waits until a permit is released.
   *
   * @returns {Promise<Function>} A release function to call when the operation completes.
   */
  async acquire() {
    if (this.count < this.max) {
      this.count++;
      return this._createRelease();
    }

    // Wait until a resource is released
    return new Promise((resolve) => {
      this.queue.push(() => {
        this.count++;
        resolve(this._createRelease());
      });
    });
  }

  /**
   * Creates a release function that decrements the count and
   * processes the next waiting caller if any.
   *
   * @returns {Function} The release function.
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
