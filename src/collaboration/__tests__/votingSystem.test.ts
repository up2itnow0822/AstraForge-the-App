import { VotingSystem, VotingProposal, Vote } from '../votingSystem';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('VotingSystem', () => {
    let votingSystem: VotingSystem;

    beforeEach(() => {
        votingSystem = new VotingSystem();
    });

    it('should create a proposal', async () => {
        const proposal: VotingProposal = {
            id: 'p1',
            description: 'Test Proposal',
            proposerId: 'agent1',
            deadline: Date.now() + 1000
        };

        const emitSpy = jest.spyOn(votingSystem, 'emit');
        await votingSystem.propose(proposal);

        expect(emitSpy).toHaveBeenCalledWith('proposalCreated', proposal);
    });

    it('should accept votes', async () => {
        const proposal: VotingProposal = {
            id: 'p1',
            description: 'Test Proposal',
            proposerId: 'agent1',
            deadline: Date.now() + 1000
        };
        await votingSystem.propose(proposal);

        const vote: Vote = { voterId: 'agent2', proposalId: 'p1', value: true };
        const emitSpy = jest.spyOn(votingSystem, 'emit');
        await votingSystem.vote(vote);

        expect(emitSpy).toHaveBeenCalledWith('voteCast', vote);
    });

    it('should calculate results correctly', async () => {
        const proposal: VotingProposal = {
            id: 'p1',
            description: 'Test Proposal',
            proposerId: 'agent1',
            deadline: Date.now() + 1000
        };
        await votingSystem.propose(proposal);

        await votingSystem.vote({ voterId: 'a2', proposalId: 'p1', value: true });
        await votingSystem.vote({ voterId: 'a3', proposalId: 'p1', value: false });
        await votingSystem.vote({ voterId: 'a4', proposalId: 'p1', value: true });

        const result = await votingSystem.getResult('p1');
        expect(result.accepted).toBe(true);
        expect(result.votesFor).toBe(2);
        expect(result.votesAgainst).toBe(1);
    });
});
