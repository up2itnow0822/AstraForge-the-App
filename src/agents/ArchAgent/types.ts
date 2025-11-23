/**
 * ArchAgent Type Definitions
 */

export interface ArchitectureProposal {
  architectureId: string;
  pattern: string;
  components: Component[];
  communication: CommunicationPattern[];
  dataFlow: DataFlow[];
  alternatives: Alternative[];
  recommendation: string;
  decisionRationale: string;
  riskAssessment: Risk[];
  costAnalysis: CostAnalysis;
}

export type ArchitecturePattern = 
  | 'monolith'
  | 'microservices'
  | 'serverless'
  | 'event-driven'
  | 'hexagonal'
  | 'clean'
  | 'layered'
  | 'soa';

export interface Component {
  name: string;
  type: string;
  responsibilities: string[];
  dependencies: string[];
}

export interface CommunicationPattern {
  pattern: string;
  protocol: string;
  description: string;
}

export interface DataFlow {
  source: string;
  destination: string;
  data: string;
  frequency: string;
}

export interface Alternative {
  pattern: ArchitecturePattern;
  pros: string[];
  cons: string[];
  cost: string;
  scalability: string;
  security: string;
  complexity: string;
}

export interface Risk {
  type: string;
  severity: 'low' | 'medium' | 'high';
  likelihood: 'low' | 'medium' | 'high';
  mitigation: string;
}

export interface CostAnalysis {
  infrastructure: string;
  operational: string;
  development: string;
  total: string;
}

export interface OptimizationResult {
  metrics: Record<string, any>;
  improvements: string[];
  tradeoffs: string[];
  recommendations: string[];
}
