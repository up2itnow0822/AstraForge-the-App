import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { agentNexusBuildRunner } from '../agentNexusBuildRunner';
import * as fs from 'fs';

jest.mock('fs');

describe('agentNexusBuildRunner', () => {
  const mockFs = fs as jest.Mocked<typeof fs>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return error if root directory does not exist', async () => {
    (mockFs.existsSync as unknown as jest.Mock<any>).mockReturnValue(false);

    const result = await agentNexusBuildRunner('/non/existent/path');

    expect(result.success).toBe(false);
    expect(result.output).toBe('Specs directory not found');
    expect(result.errors).toContain('Directory does not exist: /non/existent/path');
  });

  it('should validate projects successfully without errors', async () => {
    (mockFs.existsSync as unknown as jest.Mock<any>).mockImplementation((p: any) => {
       if (p === '/root') return true;
       if (p === '/root/01_project') return true;
       if (p.endsWith('spec.md')) return true;
       if (p.endsWith('plan.md')) return true;
       return false;
    });

    (mockFs.readdirSync as unknown as jest.Mock<any>).mockReturnValue(['01_project'] as any);
    (mockFs.statSync as unknown as jest.Mock<any>).mockReturnValue({ isDirectory: () => true } as any);
    (mockFs.readFileSync as unknown as jest.Mock<any>).mockReturnValue('Valid content');

    const result = await agentNexusBuildRunner('/root');

    expect(result.success).toBe(true);
    expect(result.output).toContain('Validated 1 projects successfully');
    expect(result.errors).toHaveLength(0);
  });

  it('should report error if no project directories found', async () => {
    (mockFs.existsSync as unknown as jest.Mock<any>).mockReturnValue(true);
    (mockFs.readdirSync as unknown as jest.Mock<any>).mockReturnValue([]);

    const result = await agentNexusBuildRunner('/root');

    expect(result.success).toBe(false);
    expect(result.errors).toContain('No project directories found in specs folder');
  });

  it('should validate spec and plan files existence', async () => {
    (mockFs.existsSync as unknown as jest.Mock<any>).mockImplementation((p: any) => {
       if (p === '/root') return true;
       if (p === '/root/01_project') return true;
       // Spec missing
       if (p.endsWith('spec.md')) return false;
       // Plan exists
       if (p.endsWith('plan.md')) return true;
       return false;
    });

    (mockFs.readdirSync as unknown as jest.Mock<any>).mockReturnValue(['01_project'] as any);
    (mockFs.statSync as unknown as jest.Mock<any>).mockReturnValue({ isDirectory: () => true } as any);
    (mockFs.readFileSync as unknown as jest.Mock<any>).mockReturnValue('Valid content');

    const result = await agentNexusBuildRunner('/root');

    expect(result.success).toBe(false);
    expect(result.errors.some(e => e.includes('specification files missing'))).toBe(true);
  });
  
  it('should handle file read errors', async () => {
     (mockFs.existsSync as unknown as jest.Mock<any>).mockReturnValue(true);
     (mockFs.readdirSync as unknown as jest.Mock<any>).mockReturnValue(['01_project'] as any);
     (mockFs.statSync as unknown as jest.Mock<any>).mockReturnValue({ isDirectory: () => true } as any);
     (mockFs.readFileSync as unknown as jest.Mock<any>).mockImplementation(() => {
         throw new Error('Read error');
     });
     
     const result = await agentNexusBuildRunner('/root');
     expect(result.success).toBe(false);
     expect(result.errors.some(e => e.includes('unreadable'))).toBe(true);
  });

});
