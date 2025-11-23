import { EventEmitter } from 'events';

export interface Vote {
    voterId: string;
    proposalId: string;
    value: boolean;
}

export interface VotingProposal {
    id: string;
    description: string;
    proposerId: string;
    deadline: number;
}

export interface VotingResult {
    proposalId: string;
    accepted: boolean;
    votesFor: number;
    votesAgainst: number;
}

export class VotingSystem extends EventEmitter {
    private proposals: Map<string, VotingProposal> = new Map();
    private votes: Map<string, Vote[]> = new Map();

    async propose(proposal: VotingProposal): Promise<void> {
        this.proposals.set(proposal.id, proposal);
        this.votes.set(proposal.id, []);
        this.emit('proposalCreated', proposal);
    }

    async vote(vote: Vote): Promise<void> {
        if (!this.proposals.has(vote.proposalId)) {
            throw new Error('Proposal not found');
        }
        const currentVotes = this.votes.get(vote.proposalId) || [];
        currentVotes.push(vote);
        this.votes.set(vote.proposalId, currentVotes);
        this.emit('voteCast', vote);
    }

    async getResult(proposalId: string): Promise<VotingResult> {
        if (!this.proposals.has(proposalId)) {
            throw new Error('Proposal not found');
        }
        const votes = this.votes.get(proposalId) || [];
        const votesFor = votes.filter(v => v.value).length;
        const votesAgainst = votes.length - votesFor;
        return {
            proposalId,
            accepted: votesFor > votesAgainst,
            votesFor,
            votesAgainst
        };
    }
}
