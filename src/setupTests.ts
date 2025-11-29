// Jest globals are automatically available in the test environment
// No explicit import needed when using ts-jest with proper configuration

// Mock OpenAI
jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Mocked response' } }],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
        })
      }
    },
    embeddings: {
      create: jest.fn().mockResolvedValue({
        data: [{ embedding: [0.1, 0.2, 0.3] }]
      })
    }
  }))
}));

// Mock LanceDB
jest.mock('@lancedb/lancedb', () => ({
  __esModule: true,
  connect: jest.fn().mockResolvedValue(undefined),
  OpenAIEmbeddingFunction: jest.fn()
}));

// Mock LanceDB Client
jest.mock('./core/storage/LanceDBClient', () => ({
  __esModule: true,
  LanceDBClient: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    search: jest.fn()
  }))
}));

// Mock WebSocket
jest.mock('ws', () => ({
  __esModule: true,
  WebSocket: jest.fn(),
  WebSocketServer: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn()
  }))
}));

beforeEach(() => {
  jest.clearAllMocks();
});
