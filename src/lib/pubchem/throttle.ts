/**
 * Request Throttling Utility
 * Ensures we don't exceed PubChem API rate limits (5 requests per second recommended)
 */

interface QueuedRequest {
  execute: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}

class RequestThrottler {
  private queue: QueuedRequest[] = [];
  private isProcessing = false;
  private readonly maxRequestsPerSecond: number;
  private readonly intervalMs: number;
  private requestCount = 0;
  private lastResetTime = Date.now();

  constructor(maxRequestsPerSecond: number = 5) {
    this.maxRequestsPerSecond = maxRequestsPerSecond;
    this.intervalMs = 1000; // 1 second
  }

  /**
   * Add a request to the throttled queue
   * @param requestFn - Function that returns a promise for the request
   */
  async throttle<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        execute: requestFn,
        resolve,
        reject,
      });

      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;

    // Reset counter if a second has passed
    const now = Date.now();
    if (now - this.lastResetTime >= this.intervalMs) {
      this.requestCount = 0;
      this.lastResetTime = now;
    }

    // If we've hit the limit, wait until the next interval
    if (this.requestCount >= this.maxRequestsPerSecond) {
      const waitTime = this.intervalMs - (now - this.lastResetTime);
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
        this.requestCount = 0;
        this.lastResetTime = Date.now();
      }
    }

    // Process next request
    const request = this.queue.shift();
    if (request) {
      this.requestCount++;

      try {
        const result = await request.execute();
        request.resolve(result);
      } catch (error) {
        request.reject(error);
      }

      // Continue processing
      setTimeout(() => this.processQueue(), 0);
    } else {
      this.isProcessing = false;
    }
  }

  /**
   * Get current queue length
   */
  getQueueLength(): number {
    return this.queue.length;
  }

  /**
   * Clear the queue
   */
  clearQueue(): void {
    this.queue = [];
    this.isProcessing = false;
  }
}

// Singleton instance for PubChem requests
export const pubchemThrottler = new RequestThrottler(5);

