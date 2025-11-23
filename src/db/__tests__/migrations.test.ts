import { MigrationManager, Migration } from '../migrations';
import { describe, it, expect, beforeEach } from '@jest/globals';

describe('MigrationManager', () => {
    let manager: MigrationManager;

    beforeEach(() => {
        manager = new MigrationManager();
    });

    it('should execute migrations in order', async () => {
        const exec1 = jest.fn().mockResolvedValue(true);
        const exec2 = jest.fn().mockResolvedValue(true);

        manager.registerMigration({
            version: '1.0.0',
            name: 'Create Table 1',
            execute: exec1,
            rollback: jest.fn().mockResolvedValue(true)
        } as unknown as Migration);

        manager.registerMigration({
            version: '1.1.0',
            name: 'Add Column',
            execute: exec2,
            rollback: jest.fn().mockResolvedValue(true)
        } as unknown as Migration);

        const result = await manager.migrate();
        expect(result.success).toBe(true);
        expect(result.applied).toEqual(['1.0.0', '1.1.0']);
        expect(exec1).toHaveBeenCalled();
        expect(exec2).toHaveBeenCalled();
    });

    it('should handle migration failure', async () => {
        manager.registerMigration({
            version: '1.0.0',
            name: 'Fail',
            execute: jest.fn().mockRejectedValue(new Error('Fail')),
            rollback: jest.fn()
        } as unknown as Migration);

        const result = await manager.migrate();
        expect(result.success).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should rollback migrations', async () => {
        const rollback2 = jest.fn().mockResolvedValue(true);

        manager.registerMigration({
            version: '1.0.0',
            name: 'Init',
            execute: jest.fn().mockResolvedValue(true),
            rollback: jest.fn().mockResolvedValue(true)
        } as unknown as Migration);

        manager.registerMigration({
            version: '2.0.0',
            name: 'Upgrade',
            execute: jest.fn().mockResolvedValue(true),
            rollback: rollback2
        } as unknown as Migration);

        await manager.migrate(); // Apply all
        
        const result = await manager.rollback('1.0.0'); // Rollback to 1.0.0 (undo 2.0.0)
        expect(result.success).toBe(true);
        expect(result.rolledBack).toContain('2.0.0');
        expect(rollback2).toHaveBeenCalled();
    });
});
