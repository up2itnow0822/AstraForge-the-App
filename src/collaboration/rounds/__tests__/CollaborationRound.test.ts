import { CollaborationRound } from '../CollaborationRound';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('CollaborationRound', () => {
    let round: CollaborationRound;

    beforeEach(() => {
        round = new CollaborationRound('session-1');
    });

    it('should start a round', () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        round.start();
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Starting collaboration round'));
        logSpy.mockRestore();
    });

    it('should end a round', () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        round.end();
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Ending collaboration round'));
        logSpy.mockRestore();
    });
});
