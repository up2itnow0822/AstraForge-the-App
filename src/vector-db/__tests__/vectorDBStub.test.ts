import { describe, it, expect, beforeEach } from '@jest/globals';
import { LanceDBVectorStore } from '../VectorDB';

describe('LanceDBVectorStore', () => {
    let db: LanceDBVectorStore;

    beforeEach(() => {
        db = new LanceDBVectorStore();
    });

    it('should be defined', () => {
        expect(db).toBeDefined();
    });

    it('should add data to store', async () => {
        await db.add({ id: 1, vector: [0.1] });
        const results = await db.query([0.1]);
        expect(results).toHaveLength(1);
    });

    it('should query data', async () => {
        await db.add({ id: 1 });
        await db.add({ id: 2 });
        const results = await db.query([0.0]);
        // The current simple implementation returns all data
        expect(results).toHaveLength(2);
    });
});
