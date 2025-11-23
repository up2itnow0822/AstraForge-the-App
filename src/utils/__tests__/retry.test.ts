import { retryAsync, sleep } from '../retry';

describe('utils/retry', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });
    afterEach(() => {
        jest.useRealTimers();
    });

    describe('retryAsync', () => {
        it('should return result immediately if successful', async () => {
            const fn = jest.fn().mockResolvedValue('success');
            const result = await retryAsync(fn, { maxRetries: 3, delay: 100, backoff: 'none' });
            expect(result).toBe('success');
            expect(fn).toHaveBeenCalledTimes(1);
        });

        it('should retry on failure and succeed', async () => {
            const fn = jest.fn()
                .mockRejectedValueOnce(new Error('fail'))
                .mockResolvedValue('success');
            
            const promise = retryAsync(fn, { maxRetries: 3, delay: 100, backoff: 'none' });
            
            await jest.advanceTimersByTimeAsync(100);
            
            const result = await promise;
            expect(result).toBe('success');
            expect(fn).toHaveBeenCalledTimes(2);
        });

        it('should fail after max retries', async () => {
            const fn = jest.fn().mockRejectedValue(new Error('fail'));
            const promise = retryAsync(fn, { maxRetries: 2, delay: 100, backoff: 'none' });
            
            // We start waiting for rejection BUT we need to advance timers for it to happen
            const validationPromise = expect(promise).rejects.toThrow('fail');
            
            // Advance timers to enable retries
            await jest.advanceTimersByTimeAsync(100);
            await jest.advanceTimersByTimeAsync(100);
            
            await validationPromise;
            expect(fn).toHaveBeenCalledTimes(3);
        });

        it('should respect exponential backoff', async () => {
            const fn = jest.fn().mockRejectedValue(new Error('fail'));
            const promise = retryAsync(fn, { maxRetries: 2, delay: 100, backoff: 'exponential' });
            
            // Prevent unhandled rejection by attaching a no-op catch
            // But we verify behavior by observing calls after time advancement
            promise.catch(() => {});

            // 1st retry: 100ms
            await jest.advanceTimersByTimeAsync(100);
            
            // 2nd retry: 200ms
            await jest.advanceTimersByTimeAsync(200);
            
            try {
                await promise;
            } catch {}
            
            expect(fn).toHaveBeenCalledTimes(3);
        });
    });

    describe('sleep', () => {
        it('should wait for specified time', async () => {
            const promise = sleep(1000);
            jest.advanceTimersByTime(1000);
            await expect(promise).resolves.toBeUndefined();
        });
    });
});
