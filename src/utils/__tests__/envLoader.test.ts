import { loadEnv, getEnv } from '../envLoader';
import dotenv from 'dotenv';

jest.mock('dotenv');

describe('envLoader', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = { ...originalEnv };
        (dotenv.config as jest.Mock).mockClear();
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('loadEnv should call dotenv.config', () => {
        loadEnv();
        expect(dotenv.config).toHaveBeenCalled();
    });

    it('getEnv should return value', () => {
        process.env.TEST_VAR = 'value';
        expect(getEnv('TEST_VAR')).toBe('value');
    });

    it('getEnv should return default', () => {
        expect(getEnv('NON_EXISTENT', 'default')).toBe('default');
    });
    
    it('getEnv should return undefined if missing and no default', () => {
        expect(getEnv('NON_EXISTENT')).toBeUndefined();
    });
});
