import { EventEmitter } from 'events';
import { Agent, Vote } from '../Agent';

export enum DebateState {
  IDLE = 'IDLE',
  PROPOSING = 'PROPOSING',
  VOTING = 'VOTING',
  CONSENSUS_CHECK = 'CONSENSUS_CHECK',
  EXECUTING = 'EXECUTING',
  FAILED = 'FAILED'
}

export class DebateManager extends EventEmitter {
  private state: DebateState = DebateState.IDLE;
  private agents: Agent[] = [];
  private currentRound: number = 0;
  private maxRounds: number = 3;

  constructor(agents: Agent[]) {
    super();
    this.agents = agents;
  }

  public async startDebate(topic: string): Promise<boolean> {
    this.state = DebateState.PROPOSING;
    this.currentRound = 1;
    this.emit('state-change', { state: this.state, round: this.currentRound });
    this.emit('log', `>>> DEBATE STARTED: "${topic}"`);

    // Round Loop
    while (this.currentRound <= this.maxRounds && (this.state as DebateState) !== DebateState.EXECUTING) {
      this.emit('log', `--- ROUND ${this.currentRound} ---`);

      // 1. Proposing Phase
      const proposer = this.agents.find(a => a.role === 'Orchestrator') || this.agents[0];
      this.emit('agent-speaking', { agentId: proposer.id });
      const proposal = await proposer.processMessage(`Propose a solution for: ${topic}`);
      this.emit('log', `${proposer.name} proposes: ${proposal}`);

      // 2. Critique Phase
      for (const agent of this.agents) {
        if (agent.id === proposer.id) continue;
        this.emit('agent-speaking', { agentId: agent.id });
        const response = await agent.processMessage(`Critique this proposal: ${proposal}`);
        this.emit('log', `${agent.name}: ${response}`);
      }

      // 3. Voting Phase
      this.state = DebateState.VOTING;
      this.emit('state-change', { state: this.state });

      const votes: Vote[] = [];
      for (const agent of this.agents) {
        const vote = await agent.castVote(proposal);
        votes.push(vote);
        this.emit('log', `${agent.name} voted ${vote.verdict.toUpperCase()} (${vote.reasoning})`);
      }

      // 4. Consensus Check
      if (this.checkConsensus(votes)) {
        this.state = DebateState.EXECUTING;
        this.emit('log', '>>> CONSENSUS REACHED. Executing plan.');
        this.emit('state-change', { state: this.state });
        return true;
      }

      this.emit('log', 'No consensus. Moving to next round...');
      this.state = DebateState.PROPOSING;
      this.currentRound++;
    }

    this.state = DebateState.FAILED;
    this.emit('log', '>>> DEBATE FAILED. Max rounds reached.');
    return false;
  }

  private checkConsensus(votes: Vote[]): boolean {
    const approveCount = votes.filter(v => v.verdict === 'approve').length;
    return approveCount > (votes.length / 2);
  }
}
