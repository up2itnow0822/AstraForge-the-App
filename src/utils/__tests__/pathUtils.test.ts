import { resolvePathInside, assertPathInside, sanitizeFileName, isSubPath } from '../pathUtils';
import * as path from 'path';

describe('pathUtils', () => {
    const base = path.resolve('/tmp/base');
    
    describe('resolvePathInside', () => {
        it('should resolve valid subpath', () => {
            const result = resolvePathInside(base, 'child');
            expect(result).toBe(path.join(base, 'child'));
        });

        it('should throw on traversal', () => {
            expect(() => resolvePathInside(base, '..', 'outside')).toThrow('Path traversal attempt detected');
        });
    });

    describe('assertPathInside', () => {
        it('should return path if inside', () => {
            const target = path.join(base, 'child');
            expect(assertPathInside(base, target)).toBe(target);
        });

        it('should throw if outside', () => {
            const target = path.resolve('/tmp/outside');
            expect(() => assertPathInside(base, target)).toThrow();
        });
    });

    describe('sanitizeFileName', () => {
        it('should replace invalid chars', () => {
            expect(sanitizeFileName('foo/bar')).toBe('foo-bar');
            expect(sanitizeFileName('foo..bar')).toBe('foo..bar');
            expect(sanitizeFileName('foo@bar', '_')).toBe('foo_bar');
        });
    });

    describe('isSubPath', () => {
       it('should return true for subpath', () => {
           expect(isSubPath(base, path.join(base, 'child'))).toBe(true);
       });
       it('should return false for outsider', () => {
           expect(isSubPath(base, '/etc/passwd')).toBe(false);
       });
    });
});
