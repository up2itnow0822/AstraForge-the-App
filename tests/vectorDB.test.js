"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const LanceDBClient_js_1 = require("../src/core/storage/LanceDBClient.js");
globals_1.jest.mock('../src/core/storage/LanceDBClient.js');
(0, globals_1.describe)('LanceDBClient', () => {
    let db;
    (0, globals_1.beforeEach)(() => {
        globals_1.jest.clearAllMocks();
        db = new LanceDBClient_js_1.LanceDBClient('./test.db');
    });
    (0, globals_1.describe)('Basic Operations', () => {
        (0, globals_1.it)('should initialize without errors', async () => {
            await (0, globals_1.expect)(db.initialize()).resolves.not.toThrow();
        });
        (0, globals_1.it)('should add a document', async () => {
            const docId = await db.addDocument('test content', { key: 'value' });
            (0, globals_1.expect)(typeof docId).toBe('string');
            (0, globals_1.expect)(docId.length).toBeGreaterThan(0);
        });
        (0, globals_1.it)('should search for documents', async () => {
            const results = await db.search('test query', 5);
            (0, globals_1.expect)(Array.isArray(results)).toBe(true);
        });
        (0, globals_1.it)('should get document by id', async () => {
            const doc = await db.getDocument('test-id');
            (0, globals_1.expect)(doc).toBeDefined();
        });
        (0, globals_1.it)('should delete document', async () => {
            await (0, globals_1.expect)(db.deleteDocument('test-id')).resolves.not.toThrow();
        });
        (0, globals_1.it)('should return stats', async () => {
            const stats = await db.getStats();
            (0, globals_1.expect)(stats).toHaveProperty('count');
            (0, globals_1.expect)(stats).toHaveProperty('size');
            (0, globals_1.expect)(stats).toHaveProperty('isIndexed');
        });
    });
    (0, globals_1.describe)('Batch Operations', () => {
        (0, globals_1.it)('should add documents in batch', async () => {
            const docs = [
                { content: 'doc 1', metadata: { id: 1 } },
                { content: 'doc 2', metadata: { id: 2 } }
            ];
            const ids = await db.addDocumentsBatch(docs);
            (0, globals_1.expect)(Array.isArray(ids)).toBe(true);
            (0, globals_1.expect)(ids.length).toBe(2);
        });
        (0, globals_1.it)('should delete documents in batch', async () => {
            await (0, globals_1.expect)(db.deleteDocumentsBatch(['id1', 'id2'])).resolves.not.toThrow();
        });
    });
});
