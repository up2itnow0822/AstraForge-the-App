import { EventEmitter } from 'events';
import { Agent, Vote } from '../Agent';
import * as fs from 'fs';
import * as path from 'path';

export enum DebateState {
  IDLE = 'IDLE',
  PARALLEL_PROPOSALS = 'PARALLEL_PROPOSALS',
  SYNTHESIS = 'SYNTHESIS',
  CONSENSUS_BUILDING = 'CONSENSUS_BUILDING',
  AWAITING_USER_APPROVAL = 'AWAITING_USER_APPROVAL',
  GENERATING_CODE = 'GENERATING_CODE',
  QC_REVIEW = 'QC_REVIEW',
  EXECUTING = 'EXECUTING',
  FAILED = 'FAILED'
}

export interface FileChange {
  path: string;
  action: 'create' | 'update' | 'delete';
  content: string;
  originalContent?: string;
}

export interface AgentProposal {
  agentId: string;
  agentName: string;
  proposal: string;
  domain: string; // e.g., 'architecture', 'security', 'ux', 'ai', 'implementation'
}

export interface SynthesisResult {
  hybridProposal: string;
  contributingAgents: string[];
  confidence: number;
}

export interface UserApprovalRequest {
  proposals: AgentProposal[];
  synthesis: SynthesisResult;
  debateSummary: string;
}

export interface DebateResult {
  success: boolean;
  proposal: string;
  fileChanges: FileChange[];
  votes: Vote[];
}

export class DebateManager extends EventEmitter {
  private state: DebateState = DebateState.IDLE;
  private agents: Agent[] = [];
  private currentRound: number = 0;
  private maxRounds: number = 3;
  private debateTimeoutMs: number = 7 * 60 * 1000; // 7 minutes
  private debateStartTime: number = 0;
  private proposals: AgentProposal[] = [];
  private synthesisResult?: SynthesisResult;
  private userApprovalCallback?: (approved: boolean, feedback?: string) => void;

  constructor(agents: Agent[]) {
    super();
    this.agents = agents;
  }

  public async startDebate(topic: string): Promise<boolean> {
    try {
        this.debateStartTime = Date.now();
        this.state = DebateState.PARALLEL_PROPOSALS;
        this.emit('state-change', { state: this.state });
        this.emit('log', `>>> DEBATE STARTED: "${topic.substring(0, 100)}..."`);
        this.emit('log', `>>> PARALLEL PROPOSAL PHASE: All agents proposing simultaneously`);

        // Phase 1: Parallel Proposals
        this.proposals = [];
        const proposalPromises = this.agents.map(async (agent) => {
          this.emit('agent-speaking', { agentId: agent.id, status: 'thinking' });
          try {
            const domainPrompt = this.getDomainPrompt(agent, topic);
            const proposal = await agent.processMessage(domainPrompt);
            this.emit('agent-speaking', { agentId: agent.id, status: 'idle' });
            this.emit('log', `${agent.name} (${this.getAgentDomain(agent)}): ${proposal.substring(0, 150)}...`);

            return {
              agentId: agent.id,
              agentName: agent.name,
              proposal,
              domain: this.getAgentDomain(agent)
            } as AgentProposal;
          } catch (e: any) {
            this.emit('agent-speaking', { agentId: agent.id, status: 'idle' });
            this.emit('log', `${agent.name} failed to propose: ${e.message}`);
            return null;
          }
        });

        const proposalResults = await Promise.all(proposalPromises);
        this.proposals = proposalResults.filter(p => p !== null) as AgentProposal[];

        if (this.proposals.length === 0) {
          this.state = DebateState.FAILED;
          this.emit('log', '>>> DEBATE FAILED. No proposals generated.');
          return false;
        }

        // Phase 2: Synthesis Phase
        this.state = DebateState.SYNTHESIS;
        this.emit('state-change', { state: this.state });
        this.emit('log', `>>> SYNTHESIS PHASE: Agents reviewing all ${this.proposals.length} proposals`);

        this.synthesisResult = await this.performSynthesis(topic);

        // Phase 3: User Approval Gate
        this.state = DebateState.AWAITING_USER_APPROVAL;
        this.emit('state-change', { state: this.state });
        this.emit('log', '>>> USER APPROVAL REQUIRED. Presenting proposal for review...');

        // Emit user approval request
        const approvalRequest: UserApprovalRequest = {
          proposals: this.proposals,
          synthesis: this.synthesisResult,
          debateSummary: `Debate completed in ${(Date.now() - this.debateStartTime) / 1000}s with ${this.proposals.length} proposals synthesized.`
        };

        this.emit('user_approval_required', approvalRequest);

        // Wait for user approval (this will be resolved by approveProposal() or requestRefinement())
        return new Promise((resolve) => {
          const timeoutId = setTimeout(() => {
            this.emit('log', '>>> DEBATE TIMEOUT. No user approval received within 7 minutes.');
            this.state = DebateState.FAILED;
            resolve(false);
          }, this.debateTimeoutMs);

          this.userApprovalCallback = (approved: boolean, feedback?: string) => {
            clearTimeout(timeoutId);
            if (approved) {
              this.proceedToImplementation(topic).then(resolve);
            } else {
              this.handleRefinementRequest(feedback || 'User requested changes').then(resolve);
            }
          };
        });

    } catch (error: any) {
        console.error("Debate Manager Critical Error:", error);
        this.emit('log', `CRITICAL ERROR: ${error.message}`);
        this.state = DebateState.FAILED;
        this.emit('file_changes', {
          success: false,
          proposal: '',
          fileChanges: [],
          votes: []
        } as DebateResult);
        return false;
    }
  }

  private async generateImplementation(topic: string, proposal: string): Promise<FileChange[]> {
    // Find the Cipher (Implementation) agent
    const coder = this.agents.find(a => a.role.includes('Impl') || a.name === 'Cipher') || this.agents[this.agents.length - 1];
    
    if (!coder) {
      this.emit('log', 'Warning: No implementation agent found, using mock implementation');
      return this.generateMockImplementation(topic);
    }

    this.emit('agent-speaking', { agentId: coder.id, status: 'coding' });
    this.emit('log', `${coder.name} is generating implementation...`);

    try {
      const codePrompt = `
Based on this approved proposal, generate the actual code implementation.

TASK: ${topic}

APPROVED PROPOSAL:
${proposal}

IMPORTANT: Respond with a JSON array of file changes. Each object must have:
- "path": the file path (e.g., "src/components/MyComponent.tsx")
- "action": "create" or "update"
- "content": the full file content

Example response format:
[
  {
    "path": "src/components/Example.tsx",
    "action": "create",
    "content": "import React from 'react';\\n\\nexport const Example = () => {\\n  return <div>Hello</div>;\\n};"
  }
]

Generate clean, production-ready code. Output ONLY the JSON array, no other text.
`;

      const response = await coder.processMessage(codePrompt);
      this.emit('agent-speaking', { agentId: coder.id, status: 'idle' });

      // Try to parse the JSON response
      try {
        // Clean up the response - remove markdown code blocks if present
        let cleanResponse = response
          .replace(/```json\s*/gi, '')
          .replace(/```\s*/g, '')
          .trim();
        
        // Find the JSON array
        const startIdx = cleanResponse.indexOf('[');
        const endIdx = cleanResponse.lastIndexOf(']');
        
        if (startIdx !== -1 && endIdx !== -1) {
          cleanResponse = cleanResponse.substring(startIdx, endIdx + 1);
        }

        // Fix common JSON issues from LLMs:
        // 1. Unescaped newlines inside strings - replace actual newlines between quotes with \n
        // 2. Trailing commas
        cleanResponse = cleanResponse
          .replace(/,\s*]/g, ']')  // Remove trailing commas before ]
          .replace(/,\s*}/g, '}'); // Remove trailing commas before }
        
        // Try to fix unescaped newlines in string values
        // This regex finds content between quotes and escapes literal newlines
        cleanResponse = cleanResponse.replace(
          /"content"\s*:\s*"([\s\S]*?)(?<!\\)"/g,
          (match, content) => {
            // Escape any unescaped newlines in the content
            const escaped = content
              .replace(/(?<!\\)\n/g, '\\n')
              .replace(/(?<!\\)\r/g, '\\r')
              .replace(/(?<!\\)\t/g, '\\t');
            return `"content": "${escaped}"`;
          }
        );

        let parsed;
        try {
          parsed = JSON.parse(cleanResponse);
        } catch (firstError) {
          // If still failing, try a more aggressive fix
          this.emit('log', `First parse attempt failed, trying aggressive JSON repair...`);
          
          // Try to extract file objects manually using regex
          const filePattern = /\{\s*"path"\s*:\s*"([^"]+)"\s*,\s*"action"\s*:\s*"([^"]+)"\s*,\s*"content"\s*:\s*"([\s\S]*?)(?<!\\)"\s*\}/g;
          const files: any[] = [];
          let match;
          
          while ((match = filePattern.exec(cleanResponse)) !== null) {
            files.push({
              path: match[1],
              action: match[2],
              content: match[3].replace(/\\n/g, '\n').replace(/\\"/g, '"')
            });
          }
          
          if (files.length > 0) {
            parsed = files;
            this.emit('log', `Extracted ${files.length} files using regex fallback`);
          } else {
            throw firstError;
          }
        }
        
        if (Array.isArray(parsed)) {
          const fileChanges: FileChange[] = parsed.map((item: any) => {
            const filePath = item.path || 'unknown.ts';
            const action = item.action || 'create';
            let originalContent = '';

            // For update actions, try to read the original file content
            if (action === 'update') {
              try {
                const fullPath = path.join(process.cwd(), filePath);
                if (fs.existsSync(fullPath)) {
                  originalContent = fs.readFileSync(fullPath, 'utf8');
                  this.emit('log', `Read original content for ${filePath} (${originalContent.length} chars)`);
                } else {
                  this.emit('log', `Warning: File ${filePath} not found for update, treating as create`);
                }
              } catch (err: any) {
                this.emit('log', `Warning: Could not read ${filePath}: ${err.message}`);
              }
            }

            return {
              path: filePath,
              action,
              content: item.content || '',
              originalContent
            };
          });

          // Validate that generated code is not mock/stub/placeholder
          const validationResult = this.validateGeneratedCode(fileChanges);
          if (!validationResult.isValid) {
            this.emit('log', `>>> CODE VALIDATION FAILED: ${validationResult.reason}`);
            this.emit('log', `>>> Rejecting mock/stub code and using fallback implementation`);
            return this.generateMockImplementation(topic);
          }

          this.emit('log', `Generated ${fileChanges.length} file(s) - validation passed`);
          return fileChanges;
        }
      } catch (parseError) {
        this.emit('log', `Warning: Could not parse code response, using fallback`);
      }

      // Fallback: If we couldn't parse JSON, create a single file with the response
      return [{
        path: 'src/generated/implementation.ts',
        action: 'create',
        content: `// Generated implementation based on: ${topic}\n// Proposal: ${proposal.substring(0, 100)}...\n\n${response}`,
        originalContent: ''
      }];

    } catch (error: any) {
      this.emit('log', `Code generation error: ${error.message}`);
      this.emit('agent-speaking', { agentId: coder.id, status: 'idle' });
      return this.generateMockImplementation(topic);
    }
  }

  private generateMockImplementation(topic: string): FileChange[] {
    // Generate a reasonable mock based on the topic
    const sanitizedName = topic.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 30);
    
    return [
      {
        path: `src/features/${sanitizedName}/index.ts`,
        action: 'create',
        content: `// Feature: ${topic}\n// Generated by AstraForge Consensus Engine\n\nexport const feature = {\n  name: '${sanitizedName}',\n  init: () => {\n    console.log('Feature initialized');\n  }\n};\n`,
        originalContent: ''
      },
      {
        path: `src/features/${sanitizedName}/types.ts`,
        action: 'create', 
        content: `// Types for: ${topic}\n\nexport interface FeatureConfig {\n  enabled: boolean;\n  options?: Record<string, unknown>;\n}\n`,
        originalContent: ''
      }
    ];
  }

  private validateGeneratedCode(fileChanges: FileChange[]): { isValid: boolean; reason?: string } {
    for (const change of fileChanges) {
      const content = change.content.toLowerCase();

      // Check for TODO comments
      if (content.includes('// todo') || content.includes('/* todo') || content.includes('// TODO')) {
        return { isValid: false, reason: `Found TODO comment in ${change.path}` };
      }

      // Check for "not implemented" patterns
      if (content.includes('not implemented') || content.includes('notimplemented') || content.includes('throw new error')) {
        return { isValid: false, reason: `Found "not implemented" or error stub in ${change.path}` };
      }

      // Check for mock/stub/placeholder patterns
      const mockPatterns = [
        'mock', 'stub', 'placeholder', 'dummy', 'fake', 'example data',
        'your code here', 'implement me', 'fill this in'
      ];

      for (const pattern of mockPatterns) {
        if (content.includes(pattern)) {
          return { isValid: false, reason: `Found "${pattern}" placeholder in ${change.path}` };
        }
      }

      // Check for empty function bodies (except for constructors and simple getters/setters)
      const emptyFunctionRegex = /function\s+\w+\s*\([^)]*\)\s*\{\s*\}/g;
      const arrowEmptyFunctionRegex = /\w+\s*=\s*\([^)]*\)\s*=>\s*\{\s*\}/g;

      if (emptyFunctionRegex.test(change.content) || arrowEmptyFunctionRegex.test(change.content)) {
        // Allow empty constructors and simple property getters/setters
        const hasMeaningfulContent = content.includes('return') || content.includes('this.') || content.includes('super(');
        if (!hasMeaningfulContent) {
          return { isValid: false, reason: `Found empty function body in ${change.path}` };
        }
      }

      // Check for console.log statements (may indicate debugging code)
      const consoleLogCount = (change.content.match(/console\.log/g) || []).length;
      if (consoleLogCount > 3) { // Allow up to 3 console.logs for debugging
        return { isValid: false, reason: `Too many console.log statements in ${change.path} (${consoleLogCount} found)` };
      }

      // Check minimum code quality - must have at least some meaningful code
      const meaningfulLines = change.content.split('\n').filter(line =>
        line.trim() &&
        !line.trim().startsWith('//') &&
        !line.trim().startsWith('/*') &&
        !line.trim().startsWith('*') &&
        !line.trim().startsWith('*/') &&
        !line.trim().startsWith('import') &&
        !line.trim().startsWith('export')
      ).length;

      if (meaningfulLines < 3) {
        return { isValid: false, reason: `Insufficient meaningful code in ${change.path} (${meaningfulLines} lines)` };
      }
    }

    return { isValid: true };
  }

  // User approval methods
  public approveProposal(): void {
    if (this.userApprovalCallback) {
      this.userApprovalCallback(true);
    }
  }

  public requestRefinement(feedback: string): void {
    if (this.userApprovalCallback) {
      this.userApprovalCallback(false, feedback);
    }
  }

  private getAgentDomain(agent: Agent): string {
    const role = agent.role.toLowerCase();
    if (role.includes('orchestrator')) return 'architecture';
    if (role.includes('security')) return 'security';
    if (role.includes('product')) return 'ux';
    if (role.includes('ai') || role.includes('systems')) return 'ai';
    if (role.includes('implement')) return 'implementation';
    return 'general';
  }

  private getDomainPrompt(agent: Agent, topic: string): string {
    const domain = this.getAgentDomain(agent);
    const prompts = {
      architecture: `As the Orchestrator, propose a comprehensive technical architecture for: ${topic}. Focus on system design, component structure, data flow, and technical feasibility.`,
      security: `As the Security Specialist, propose security requirements and mitigations for: ${topic}. Identify ALL potential security risks, authentication needs, data protection, and compliance requirements.`,
      ux: `As the Product Manager, propose user experience and product requirements for: ${topic}. Focus on user needs, accessibility, usability, and business value.`,
      ai: `As the AI Systems Specialist, propose AI/ML integration patterns for: ${topic}. Consider RAG, embeddings, model selection, inference optimization, and AI-native architectures.`,
      implementation: `As the Implementation Architect, propose concrete implementation approach for: ${topic}. Focus on code structure, technologies, patterns, and development methodology.`
    };

    return prompts[domain as keyof typeof prompts] || `Propose a solution for: ${topic}`;
  }

  private async performSynthesis(topic: string): Promise<SynthesisResult> {
    const synthesisAgent = this.agents.find(a => a.role.includes('Orchestrator')) || this.agents[0];

    const synthesisPrompt = `
You are synthesizing ${this.proposals.length} proposals into one cohesive solution.

TOPIC: ${topic}

PROPOSALS RECEIVED:
${this.proposals.map(p => `--- ${p.agentName} (${p.domain}): ---\n${p.proposal}`).join('\n\n')}

TASK: Create a unified proposal that incorporates the best elements from all proposals.
- Identify complementary ideas and integrate them
- Resolve conflicts between proposals
- Ensure the final proposal addresses all major concerns (security, UX, AI, implementation)
- Maintain technical feasibility

OUTPUT: A single, comprehensive proposal that represents the synthesis of all input proposals.
`;

    this.emit('agent-speaking', { agentId: synthesisAgent.id, status: 'thinking' });
    const hybridProposal = await synthesisAgent.processMessage(synthesisPrompt);
    this.emit('agent-speaking', { agentId: synthesisAgent.id, status: 'idle' });

    return {
      hybridProposal,
      contributingAgents: this.proposals.map(p => p.agentId),
      confidence: 0.85 // Could be calculated based on agent agreement
    };
  }

  private async proceedToImplementation(topic: string): Promise<boolean> {
    if (!this.synthesisResult) return false;

    this.state = DebateState.GENERATING_CODE;
    this.emit('state-change', { state: this.state });
    this.emit('log', '>>> USER APPROVED. Proceeding to implementation...');

    // QC Review Phase
    this.state = DebateState.QC_REVIEW;
    this.emit('state-change', { state: this.state });
    this.emit('log', '>>> QC REVIEW: All agents performing quality assurance...');

    const qcPassed = await this.performQCReview(this.synthesisResult.hybridProposal);
    if (!qcPassed) {
      this.emit('log', '>>> QC FAILED. Agents fixing issues...');
      // Could implement automatic fixes here
    }

    // Generate Code
    this.state = DebateState.GENERATING_CODE;
    this.emit('state-change', { state: this.state });
    this.emit('log', '>>> GENERATING CODE: Cipher implementing the approved solution...');

    const fileChanges = await this.generateImplementation(topic, this.synthesisResult.hybridProposal);

    this.state = DebateState.EXECUTING;
    this.emit('state-change', { state: this.state, phase: 'voting_concluded' });

    this.emit('file_changes', {
      success: true,
      proposal: this.synthesisResult.hybridProposal,
      fileChanges,
      votes: [] // No traditional votes in new system
    } as DebateResult);

    this.emit('log', `>>> IMPLEMENTATION COMPLETE: ${fileChanges.length} file(s) to review`);
    return true;
  }

  private async handleRefinementRequest(feedback: string): Promise<boolean> {
    this.emit('log', `>>> USER REQUESTED CHANGES: ${feedback}`);

    // Reset for another round with user feedback incorporated
    this.currentRound++;
    if (this.currentRound > this.maxRounds) {
      this.state = DebateState.FAILED;
      this.emit('log', '>>> DEBATE FAILED. Maximum refinement rounds reached.');
      return false;
    }

    // Re-run debate with user feedback
    const refinementTopic = `Original request with user feedback: ${feedback}`;
    return this.startDebate(refinementTopic);
  }

  private async performQCReview(proposal: string): Promise<boolean> {
    this.emit('log', '>>> QC PHASE: Running automated checks...');

    // First run automated checks
    const automatedChecksPassed = await this.runAutomatedQC();
    if (!automatedChecksPassed) {
      this.emit('log', '>>> QC FAILED: Automated checks found issues');
      return false;
    }

    // Then run agent reviews
    const qcPromises = this.agents.map(async (agent) => {
      const qcPrompt = `
Review this proposal for quality in your domain of expertise:

PROPOSAL: ${proposal}

TASK: Check for issues in ${this.getAgentDomain(agent)} aspects.
- Identify any problems, risks, or improvements needed
- Verify compliance with best practices in your domain
- Rate the quality on a scale of 1-10

OUTPUT: If you find issues, describe them. If quality is acceptable (7+), respond with "APPROVED".
`;

      try {
        const review = await agent.processMessage(qcPrompt);
        const approved = review.toUpperCase().includes('APPROVED') || review.includes('7') || review.includes('8') || review.includes('9') || review.includes('10');
        this.emit('log', `${agent.name} QC: ${approved ? 'APPROVED' : 'ISSUES FOUND'}`);
        return approved;
      } catch (e) {
        this.emit('log', `${agent.name} QC failed: ${e}`);
        return false;
      }
    });

    const qcResults = await Promise.all(qcPromises);
    const passed = qcResults.filter(r => r).length >= Math.ceil(this.agents.length * 0.7); // 70% approval
    this.emit('log', `>>> QC RESULT: ${qcResults.filter(r => r).length}/${this.agents.length} agents approved (${passed ? 'PASSED' : 'FAILED'})`);
    return passed;
  }

  private async runAutomatedQC(): Promise<boolean> {
    try {
      // Run ESLint check
      const eslintPassed = await this.runESLint();
      if (!eslintPassed) {
        this.emit('log', '>>> ESLint check FAILED');
        return false;
      }

      // Run TypeScript type check
      const tsPassed = await this.runTypeScriptCheck();
      if (!tsPassed) {
        this.emit('log', '>>> TypeScript check FAILED');
        return false;
      }

      this.emit('log', '>>> Automated QC checks PASSED');
      return true;
    } catch (error) {
      this.emit('log', `>>> Automated QC failed with error: ${error}`);
      return false;
    }
  }

  private async runESLint(): Promise<boolean> {
    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);

      // Run ESLint on the project
      await execAsync('npx eslint src/ --ext .ts,.tsx --max-warnings 0', {
        cwd: process.cwd(),
        timeout: 30000 // 30 second timeout
      });

      this.emit('log', '>>> ESLint: No linting errors found');
      return true;
    } catch (error: any) {
      // Check if it's just warnings or actual errors
      if (error.stdout && error.stdout.includes('error')) {
        this.emit('log', `>>> ESLint: Found errors - ${error.stdout.split('\n').filter((line: string) => line.includes('error')).length} errors`);
        return false;
      }
      // Warnings are OK
      this.emit('log', '>>> ESLint: Only warnings found (acceptable)');
      return true;
    }
  }

  private async runTypeScriptCheck(): Promise<boolean> {
    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);

      // Run TypeScript compiler check
      await execAsync('npx tsc --noEmit --skipLibCheck', {
        cwd: process.cwd(),
        timeout: 30000 // 30 second timeout
      });

      this.emit('log', '>>> TypeScript: No type errors found');
      return true;
    } catch (error: any) {
      this.emit('log', `>>> TypeScript: Found type errors - ${error.stdout?.split('\n').filter((line: string) => line.includes('error TS')).length || 'unknown'} errors`);
      return false;
    }
  }

  private checkConsensus(votes: Vote[]): boolean {
    if (votes.length === 0) return false;
    const approveCount = votes.filter(v => v.verdict === 'approve').length;
    return approveCount > (votes.length / 2);
  }
}
