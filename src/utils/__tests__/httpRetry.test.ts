import { fetchWithRetry } from '../httpRetry';

// Mock global fetch
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.Mock;

describe('fetchWithRetry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should succeed on first try', async () => {
    mockFetch.mockResolvedValue({ 
      ok: true, 
      status: 200, 
      json: () => Promise.resolve({}) 
    });

    const res = await fetchWithRetry('http://test.com');
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should retry on configured status codes', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({ ok: true, status: 200 });

    const promise = fetchWithRetry('http://test.com', { retries: { retries: 3, retryDelay: 100, retryOn: [500], timeout: 1000 } });
    
    await jest.runAllTimersAsync();
    const res = await promise;
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should not retry on non-retry status codes', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404 });

    const res = await fetchWithRetry('http://test.com');
    expect(res.status).toBe(404);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should throw if max retries reached', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 503 });

    const promise = fetchWithRetry('http://test.com', { retries: { retries: 2, retryDelay: 100, retryOn: [503], timeout: 1000 } });
    
    // Attach catch to prevent unhandled rejection during timer advancement
    promise.catch(() => {});
    
    await jest.runAllTimersAsync();
    await jest.runAllTimersAsync();
    await jest.runAllTimersAsync();

    await expect(promise).rejects.toThrow('HTTP 503');
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('should handle https urls agent', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200 });
    await fetchWithRetry('https://secure.com');
    const callArgs = mockFetch.mock.calls[0];
    const options = callArgs[1];
    expect(options.agent).toBeDefined();
  });
});
