export interface RetryOptions {
  maxRetries: number;
  delay: number;
  backoff: 'none' | 'linear' | 'exponential';
}

/**
 *
 * @param fn
 * @param options
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const { maxRetries, delay, backoff } = options;
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) break;
      
      let waitTime = delay;
      if (backoff === 'linear') {
        waitTime = delay * (attempt + 1);
      } else if (backoff === 'exponential') {
        waitTime = delay * Math.pow(2, attempt);
      }
      
      await sleep(waitTime);
    }
  }

  throw lastError || new Error('Retry failed');
}

/**
 *
 * @param ms
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
