import { jest } from '@jest/globals';

jest.mock('openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: 'Test response' } }],
            usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 }
          } as any)
        }
      }
    }))
  };
});

jest.mock('@lancedb/lancedb', () => {
  return {
    connect: jest.fn().mockResolvedValue({
      table: jest.fn().mockResolvedValue({
        add: jest.fn().mockResolvedValue(undefined as any),
        search: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([{ id: 'test', content: 'test', metadata: {} } as any])
        }),
        countRows: jest.fn().mockResolvedValue(1 as any)
      })
    } as any)
  };
});

jest.mock('ws', () => {
  return {
    Server: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
      close: jest.fn()
    })),
    WebSocket: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
      send: jest.fn(),
      close: jest.fn()
    }))
  };
});
