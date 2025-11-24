import { retryAsync } from './retry';
import { Agent as HttpAgent } from 'http';
import { Agent as HttpsAgent } from 'https';

export interface HttpRetryOptions {
  retries: number;
  retryDelay: number;
  retryOn: number[];
  timeout: number;
}

const defaultOptions: HttpRetryOptions = {
  retries: 3,
  retryDelay: 1000,
  retryOn: [429, 500, 502, 503, 504],
  timeout: 10000
};

/**
 *
 * @param url
 * @param options
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit & { retries?: HttpRetryOptions } = {}
): Promise<Response> {
  const retry = options.retries || defaultOptions;
  
  const fetchOptions = {
    ...options,
    agent: url.startsWith('https') ? new HttpsAgent({ keepAlive: true }) : new HttpAgent({ keepAlive: true })
  };

  return retryAsync(
    async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), retry.timeout);
      
      try {
        const response = await fetch(url, { ...fetchOptions, signal: controller.signal });
        
        if (retry.retryOn.includes(response.status)) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        return response;
      } finally {
        clearTimeout(timeoutId);
      }
    },
    {
      maxRetries: retry.retries,
      delay: retry.retryDelay,
      backoff: 'exponential'
    }
  );
}
