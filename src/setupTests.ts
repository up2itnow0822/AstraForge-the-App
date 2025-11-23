import { jest, beforeEach, describe, it, expect } from '@jest/globals';

// Cast jest.fn() as any to prevent 'never' type inference
jest.mock('openai', () => ({
  __esModule: true,
  default: (jest.fn() as any).mockImplementation(() => ({
    chat: {
      completions: {
        create: (jest.fn() as any).mockResolvedValue({
          choices: [{ message: { content: 'Mocked response' } }],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
        })
      }
    },
    embeddings: {
      create: (jest.fn() as any).mockResolvedValue({
        data: [{ embedding: [0.1, 0.2, 0.3] }]
      })
    }
  }))
}));

jest.mock('@lancedb/lancedb', () => ({
  __esModule: true,
  connect: (jest.fn() as any).mockResolvedValue(undefined),
  OpenAIEmbeddingFunction: jest.fn()
}));

jest.mock('./core/storage/LanceDBClient', () => ({
  __esModule: true,
  LanceDBClient: (jest.fn() as any).mockImplementation(() => ({
    add: jest.fn(),
    search: jest.fn()
  }))
}));

jest.mock('ws', () => ({
  __esModule: true,
  WebSocket: jest.fn(),
  WebSocketServer: (jest.fn() as any).mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn()
  }))
}));

beforeEach(() => {
  jest.clearAllMocks();
});
