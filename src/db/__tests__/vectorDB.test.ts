import { VectorDB, VectorDocument } from '../vectorDB';
import { describe, it, expect, beforeEach } from '@jest/globals';

describe('VectorDB', () => {
    let db: VectorDB;

    beforeEach(() => {
        db = new VectorDB();
    });

    it('should initialize correctly', async () => {
        await db.init();
        expect(db.isInitialized()).toBe(true);
    });

    it('should add documents', async () => {
        await db.init();
        const doc: VectorDocument = {
            id: 'doc1',
            content: 'test content',
            embedding: [0.1, 0.2, 0.3]
        };
        await db.add(doc);
        expect(db.getCount()).toBe(1);
    });

    it('should search documents', async () => {
        await db.init();
        const doc1: VectorDocument = {
            id: 'doc1',
            content: 'hello',
            embedding: [1, 0, 0]
        };
        const doc2: VectorDocument = {
            id: 'doc2',
            content: 'world',
            embedding: [0, 1, 0]
        };
        await db.add(doc1);
        await db.add(doc2);

        // Search close to doc1
        const results = await db.search([0.9, 0.1, 0]);
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].document.id).toBe('doc1');
    });

    it('should clear database', async () => {
        await db.init();
        await db.add({ id: '1', content: 'a', embedding: [] });
        await db.clear();
        expect(db.getCount()).toBe(0);
    });
});
