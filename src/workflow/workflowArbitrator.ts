import { TelemetryPipeline } from './telemetryPipeline';
import { WorkflowAction, WorkflowMetrics, WorkflowState } from './types';

export interface ArbitrationContext {
  phase: string;
  state: WorkflowState;
  metrics: WorkflowMetrics;
  recommended: WorkflowAction;
  iteration: number;
}

export interface ArbitrationDecision {
  action: WorkflowAction;
  overridesRecommendation: boolean;
  reason: string;
}

interface ArbitrationOptions {
  minConfidence?: number;
  maxErrorRate?: number;
}

export class WorkflowArbitrator {
  private readonly minConfidence: number;
  private readonly maxErrorRate: number;

  constructor(
    private readonly telemetry: TelemetryPipeline,
    options: ArbitrationOptions = {}
  ) {
    this.minConfidence = options.minConfidence ?? 0.35;
    this.maxErrorRate = options.maxErrorRate ?? 0.3;
  }

  decide(context: ArbitrationContext): ArbitrationDecision {
    const { phase, recommended, state, metrics, iteration } = context;
    let action = recommended;
    let overrides = false;
    let reason = 'Using reinforcement learning recommendation.';

    const shouldFallback =
      recommended.confidence < this.minConfidence ||
      state.errorRate > this.maxErrorRate;

    if (shouldFallback && recommended.type !== 'continue') {
      action = { type: 'continue', confidence: 1 };
      overrides = true;
      reason = `Fallback enforced for ${phase}: confidence=${recommended.confidence.toFixed(2)} errorRate=${state.errorRate.toFixed(2)}`;
    }

    if (recommended.type === 'skip' && metrics.errors > 0) {
      action = { type: 'continue', confidence: 0.9 };
      overrides = true;
      reason = `Skip prevented for ${phase} due to existing errors.`;
    }

    this.telemetry.record({
      category: 'workflow',
      type: 'arbitration',
      severity: overrides ? 'warning' : 'info',
      message: reason,
      data: {
        phase,
        iteration,
        recommended: recommended.type,
        applied: action.type,
        confidence: recommended.confidence,
        errorRate: state.errorRate
      }
    });

    return { action, overridesRecommendation: overrides, reason };
  }
}
