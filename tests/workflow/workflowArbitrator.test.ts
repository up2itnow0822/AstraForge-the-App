import { TelemetryPipeline } from '../../src/workflow/telemetryPipeline';
import { WorkflowArbitrator } from '../../src/workflow/workflowArbitrator';
import { WorkflowAction, WorkflowMetrics, WorkflowState } from '../../src/workflow/types';

describe('WorkflowArbitrator', () => {
  const baseState: WorkflowState = {
    currentPhase: 'analysis',
    projectComplexity: 0.5,
    userSatisfaction: 0.9,
    errorRate: 0.05,
    timeSpent: 1_000,
  };

  const baseMetrics: WorkflowMetrics = {
    startTime: 0,
    phaseStartTime: 0,
    errors: 0,
    userFeedback: [],
    iterations: 1,
  };

  it('accepts reinforcement learning recommendations when thresholds are satisfied', () => {
    const telemetry = new TelemetryPipeline();
    const arbitrator = new WorkflowArbitrator(telemetry, { minConfidence: 0.4, maxErrorRate: 0.3 });
    const recommended: WorkflowAction = { type: 'continue', confidence: 0.7 };

    const decision = arbitrator.decide({
      phase: 'analysis',
      state: baseState,
      metrics: baseMetrics,
      recommended,
      iteration: 3,
    });

    expect(decision.overridesRecommendation).toBe(false);
    expect(decision.action).toBe(recommended);

    const events = telemetry.flush();
    expect(events).toHaveLength(1);
    expect(events[0].severity).toBe('info');
    expect(events[0].data).toMatchObject({ applied: 'continue', recommended: 'continue', iteration: 3 });
  });

  it('prevents skipping when outstanding errors exist', () => {
    const telemetry = new TelemetryPipeline();
    const arbitrator = new WorkflowArbitrator(telemetry);

    const decision = arbitrator.decide({
      phase: 'synthesis',
      state: { ...baseState, currentPhase: 'synthesis', errorRate: 0.1 },
      metrics: { ...baseMetrics, errors: 2 },
      recommended: { type: 'skip', confidence: 0.8 },
      iteration: 5,
    });

    expect(decision.overridesRecommendation).toBe(true);
    expect(decision.action.type).toBe('continue');
    expect(decision.reason).toContain('Skip prevented');

    const events = telemetry.flush();
    expect(events).toHaveLength(1);
    expect(events[0].severity).toBe('warning');
    expect(events[0].data).toMatchObject({ applied: 'continue', recommended: 'skip', iteration: 5 });
  });

  it('falls back to safe continuation when confidence is too low or errors are too high', () => {
    const telemetry = new TelemetryPipeline();
    const arbitrator = new WorkflowArbitrator(telemetry, { minConfidence: 0.6, maxErrorRate: 0.3 });

    const decision = arbitrator.decide({
      phase: 'execution',
      state: { ...baseState, currentPhase: 'execution', errorRate: 0.4 },
      metrics: baseMetrics,
      recommended: { type: 'optimize', confidence: 0.2 },
      iteration: 2,
    });

    expect(decision.overridesRecommendation).toBe(true);
    expect(decision.action.type).toBe('continue');
    expect(decision.reason).toContain('Fallback enforced');

    const events = telemetry.flush();
    expect(events).toHaveLength(1);
    expect(events[0].data).toMatchObject({ applied: 'continue', recommended: 'optimize', confidence: 0.2 });
  });
});
