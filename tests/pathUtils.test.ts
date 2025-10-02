import * as path from 'path';
import { assertPathInside, resolvePathInside, sanitizeFileName, isSubPath } from '../src/utils/pathUtils';

describe('pathUtils', () => {
  const workspace = path.join(__dirname, 'fixtures');

  it('resolves paths inside workspace', () => {
    const resolved = resolvePathInside(workspace, 'output', 'file.txt');
    expect(resolved.startsWith(workspace)).toBe(true);
    expect(resolved.endsWith(path.join('output', 'file.txt'))).toBe(true);
  });

  it('throws on traversal outside workspace', () => {
    expect(() => resolvePathInside(workspace, '..', 'etc', 'passwd')).toThrow('Path traversal attempt detected');
  });

  it('asserts path inside workspace', () => {
    const nested = path.join(workspace, 'nested');
    expect(assertPathInside(workspace, nested)).toBe(nested);
    expect(() => assertPathInside(workspace, path.resolve('/tmp'))).toThrow('Path traversal attempt detected');
  });

  it('sanitizes filenames', () => {
    expect(sanitizeFileName('Hello World!')).toBe('hello-world');
    expect(sanitizeFileName('Phase_1/../Output')).toBe('phase-1-output');
    expect(sanitizeFileName('')).toBe('artifact');
  });

  it('checks sub path relationships', () => {
    const nested = path.join(workspace, 'nested', 'file.txt');
    expect(isSubPath(workspace, nested)).toBe(true);
    expect(isSubPath(workspace, workspace)).toBe(true);
    expect(isSubPath(workspace, '/tmp')).toBe(false);
  });
});
