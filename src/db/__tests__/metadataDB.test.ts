import { MetadataDB } from '../metadataDB';
import { describe, it, expect, beforeEach } from '@jest/globals';

describe('MetadataDB', () => {
    let db: MetadataDB;

    beforeEach(() => {
        db = new MetadataDB(':memory:');
    });

    it('should initialize', async () => {
        await db.init();
        expect(db).toBeDefined();
    });

    it('should insert and get record', async () => {
        const success = await db.insert('id1', { foo: 'bar' });
        expect(success).toBe(true);

        const record = await db.get('id1');
        expect(record).toBeDefined();
        expect(record?.id).toBe('id1');
        expect(record?.data).toEqual({ foo: 'bar' });
    });

    it('should not insert duplicate id', async () => {
        await db.insert('id1', {});
        const success = await db.insert('id1', { other: 'data' });
        expect(success).toBe(false);
    });

    it('should update existing record', async () => {
        await db.insert('id1', { val: 1 });
        const success = await db.update('id1', { val: 2 });
        expect(success).toBe(true);
        const record = await db.get('id1');
        expect(record?.data.val).toBe(2);
    });

    it('should not update non-existent record', async () => {
        const success = await db.update('id-missing', {});
        expect(success).toBe(false);
    });

    it('should delete record', async () => {
        await db.insert('id1', {});
        const success = await db.delete('id1');
        expect(success).toBe(true);
        expect(await db.exists('id1')).toBe(false);
    });

    it('should query records', async () => {
        await db.insert('1', { role: 'admin', active: true });
        await db.insert('2', { role: 'user', active: true });
        await db.insert('3', { role: 'admin', active: false });

        const admins = await db.query({ role: 'admin' });
        expect(admins.length).toBe(2);
        expect(admins.map(r => r.id)).toContain('1');
        expect(admins.map(r => r.id)).toContain('3');

        const active = await db.query({ active: true });
        expect(active.length).toBe(2);
    });

    it('should return empty array if query criteria mismatch', async () => {
         await db.insert('1', { role: 'admin' });
         const results = await db.query({ role: 'super' });
         expect(results.length).toBe(0);
    });
    
    it('should handle complex criteria', async () => {
        await db.insert('1', { a: 1, b: 2 });
        await db.insert('2', { a: 1, b: 3 });
        
        const res = await db.query({ a: 1, b: 2 });
        expect(res.length).toBe(1);
        expect(res[0].id).toBe('1');
    });

    it('should batch insert records', async () => {
        const records = [
            { id: 'b1', data: { x: 1 } },
            { id: 'b2', data: { x: 2 } },
            { id: 'b1', data: { x: 3 } } // duplicate, should fail
        ];
        
        // Pre-insert dupe to test failure branch inside batch loop
        await db.insert('b1', { original: true });

        const count = await db.batchInsert(records);
        // b1 fails (duplicate), b2 succeeds, b1 (3rd) fails (duplicate). Wait, actually the FIRST b1 fails because I pre-inserted it.
        // Wait, let's verify logic.
        // I inserted b1 manually. 
        // loop: 
        // 1. insert b1 -> fail (exists)
        // 2. insert b2 -> success
        // 3. insert b1 -> fail
        // Expect count = 1

        expect(count).toBe(1);
        expect(await db.exists('b2')).toBe(true);
    });

    it('should get count', async () => {
        await db.insert('1', {});
        await db.insert('2', {});
        expect(db.getCount()).toBe(2);
    });
});
