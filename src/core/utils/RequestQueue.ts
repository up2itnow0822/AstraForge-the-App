
/**
 * simple-queue.ts
 * A simple async queue to serialize promises.
 */
export class RequestQueue {
  private queue: Promise<void> = Promise.resolve();

  /**
   * Enqueues a task to be executed sequentially.
   * @param task A function that returns a promise.
   * @returns The result of the task.
   */
  enqueue<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue = this.queue.then(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
    });
  }
}

export const localLLMQueue = new RequestQueue();

