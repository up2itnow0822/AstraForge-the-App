export async function withRetry<T>(fn: () => Promise<T>, retries = 3, initialBackoffMs = 250): Promise<T> {
  let lastError: Error;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i === retries) throw lastError;
      const backoff = initialBackoffMs * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, backoff));
    }
  }
  throw lastError!;
}
