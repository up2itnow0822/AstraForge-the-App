import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { LanceDBClient } from '../src/core/storage/LanceDBClient.js';

jest.mock('../src/core/storage/LanceDBClient.js');

describe('LanceDBClient', () => {
  let db: LanceDBClient;

  beforeEach(() => {
    jest.clearAllMocks();
    db = new LanceDBClient('./test.db');
  });

  describe('Basic Operations', () => {
    it('should initialize without errors', async () => {
      await expect(db.initialize()).resolves.not.toThrow();
    });

    it('should add a document', async () => {
      const docId = await db.addDocument('test content', { key: 'value' });
      expect(typeof docId).toBe('string');
      expect(docId.length).toBeGreaterThan(0);
    });

    it('should search for documents', async () => {
      const results = await db.search('test query', 5);
      expect(Array.isArray(results)).toBe(true);
    });

    it('should get document by id', async () => {
      const doc = await db.getDocument('test-id');
      expect(doc).toBeDefined();
    });

    it('should delete document', async () => {
      await expect(db.deleteDocument('test-id')).resolves.not.toThrow();
    });

    it('should return stats', async () => {
      const stats = await db.getStats();
      expect(stats).toHaveProperty('count');
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('isIndexed');
    });
  });

  describe('Batch Operations', () => {
    it('should add documents in batch', async () => {
      const docs = [
        { content: 'doc 1', metadata: { id: 1 } },
        { content: 'doc 2', metadata: { id: 2 } }
      ];
      const ids = await db.addDocumentsBatch(docs);
      expect(Array.isArray(ids)).toBe(true);
      expect(ids.length).toBe(2);
    });

    it('should delete documents in batch', async () => {
      await expect(db.deleteDocumentsBatch(['id1', 'id2'])).resolves.not.toThrow();
    });
  });
});
