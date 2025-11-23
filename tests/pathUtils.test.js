"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("path"));
const pathUtils_1 = require("../src/utils/pathUtils");
describe('pathUtils', () => {
    const workspace = path.join(__dirname, 'fixtures');
    it('resolves paths inside workspace', () => {
        const resolved = (0, pathUtils_1.resolvePathInside)(workspace, 'output', 'file.txt');
        expect(resolved.startsWith(workspace)).toBe(true);
        expect(resolved.endsWith(path.join('output', 'file.txt'))).toBe(true);
    });
    it('throws on traversal outside workspace', () => {
        expect(() => (0, pathUtils_1.resolvePathInside)(workspace, '..', 'etc', 'passwd')).toThrow('Path traversal attempt detected');
    });
    it('asserts path inside workspace', () => {
        const nested = path.join(workspace, 'nested');
        expect((0, pathUtils_1.assertPathInside)(workspace, nested)).toBe(nested);
        expect(() => (0, pathUtils_1.assertPathInside)(workspace, path.resolve('/tmp'))).toThrow('Path traversal attempt detected');
    });
    it('sanitizes filenames', () => {
        expect((0, pathUtils_1.sanitizeFileName)('Hello World!')).toBe('hello-world');
        expect((0, pathUtils_1.sanitizeFileName)('Phase_1/../Output')).toBe('phase-1-output');
        expect((0, pathUtils_1.sanitizeFileName)('')).toBe('artifact');
    });
    it('checks sub path relationships', () => {
        const nested = path.join(workspace, 'nested', 'file.txt');
        expect((0, pathUtils_1.isSubPath)(workspace, nested)).toBe(true);
        expect((0, pathUtils_1.isSubPath)(workspace, workspace)).toBe(true);
        expect((0, pathUtils_1.isSubPath)(workspace, '/tmp')).toBe(false);
    });
});
