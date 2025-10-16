// src/git/httpRetry.ts
export class HttpRetry {
  private maxRetries: number;
  private baseDelay: number;

  constructor(maxRetries = 3, baseDelay = 1000) {
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: any;
    for (let i = 0; i < this.maxRetries; i++) {
      try {
        return await fn();
      } catch (err: any) {
        lastError = err;
        if (err.status !== 429 || i === this.maxRetries - 1) {
          throw err;
        }
        const delay = this.baseDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw lastError;
  }
}
