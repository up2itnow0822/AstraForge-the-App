import { APITester } from '../apiTester';
import { EventEmitter } from 'events';

describe('APITester (legacy)', () => {
    it('should be an instance of EventEmitter', () => {
        const tester = new APITester();
        expect(tester).toBeInstanceOf(EventEmitter);
    });
});
