export interface WorkflowState {
  currentPhase: string;
  projectComplexity: number;
  userSatisfaction: number;
  errorRate: number;
  timeSpent: number;
}

export type WorkflowActionType = 'continue' | 'skip' | 'repeat' | 'branch' | 'optimize';

export interface WorkflowAction {
  type: WorkflowActionType;
  target?: string;
  confidence: number;
}

export interface WorkflowMetrics {
  startTime: number;
  phaseStartTime: number;
  errors: number;
  userFeedback: number[];
  iterations: number;
}
