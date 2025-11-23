"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
globals_1.jest.mock('openai', () => {
    return {
        OpenAI: globals_1.jest.fn().mockImplementation(() => ({
            chat: {
                completions: {
                    create: globals_1.jest.fn().mockResolvedValue({
                        choices: [{ message: { content: 'Test response' } }],
                        usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 }
                    })
                }
            }
        }))
    };
});
globals_1.jest.mock('@lancedb/lancedb', () => {
    return {
        connect: globals_1.jest.fn().mockResolvedValue({
            table: globals_1.jest.fn().mockResolvedValue({
                add: globals_1.jest.fn().mockResolvedValue(undefined),
                search: globals_1.jest.fn().mockReturnValue({
                    limit: globals_1.jest.fn().mockResolvedValue([{ id: 'test', content: 'test', metadata: {} }])
                }),
                countRows: globals_1.jest.fn().mockResolvedValue(1)
            })
        })
    };
});
globals_1.jest.mock('ws', () => {
    return {
        Server: globals_1.jest.fn().mockImplementation(() => ({
            on: globals_1.jest.fn(),
            close: globals_1.jest.fn()
        })),
        WebSocket: globals_1.jest.fn().mockImplementation(() => ({
            on: globals_1.jest.fn(),
            send: globals_1.jest.fn(),
            close: globals_1.jest.fn()
        }))
    };
});
