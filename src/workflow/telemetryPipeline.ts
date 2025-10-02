import { logger } from '../utils/logger';

export type TelemetrySeverity = 'info' | 'warning' | 'error' | 'critical';

export interface TelemetryEvent {
  id: string;
  timestamp: number;
  category: string;
  type: string;
  severity: TelemetrySeverity;
  message: string;
  data?: Record<string, unknown>;
}

export interface TelemetrySummary {
  totalEvents: number;
  categories: Record<string, { count: number; lastEvent: number; highestSeverity: TelemetrySeverity }>;
}

type TelemetrySubscriber = (event: TelemetryEvent) => void;

const severityPriority: Record<TelemetrySeverity, number> = {
  info: 0,
  warning: 1,
  error: 2,
  critical: 3
};

export class TelemetryPipeline {
  private readonly buffer: TelemetryEvent[] = [];
  private readonly subscribers: Set<TelemetrySubscriber> = new Set();
  private readonly aggregates: Map<string, { count: number; lastEvent: number; highestSeverity: TelemetrySeverity }> = new Map();
  private readonly maxBufferSize: number;
  private readonly flushIntervalMs: number;
  private lastFlush = Date.now();

  constructor(options: { maxBufferSize?: number; flushIntervalMs?: number } = {}) {
    this.maxBufferSize = options.maxBufferSize ?? 100;
    this.flushIntervalMs = options.flushIntervalMs ?? 15_000;
  }

  record(event: Omit<TelemetryEvent, 'id' | 'timestamp'> & { id?: string; timestamp?: number }): TelemetryEvent {
    const telemetryEvent: TelemetryEvent = {
      ...event,
      id: event.id ?? `telemetry_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: event.timestamp ?? Date.now()
    };

    this.buffer.push(telemetryEvent);
    this.updateAggregates(telemetryEvent);
    this.subscribers.forEach(subscriber => {
      try {
        subscriber(telemetryEvent);
      } catch (error) {
        logger.warn('Telemetry subscriber threw an error', error);
      }
    });

    if (this.shouldFlush()) {
      this.flush();
    }

    return telemetryEvent;
  }

  onEvent(subscriber: TelemetrySubscriber): () => void {
    this.subscribers.add(subscriber);
    return () => this.subscribers.delete(subscriber);
  }

  flush(): TelemetryEvent[] {
    if (this.buffer.length === 0) {
      return [];
    }

    const events = [...this.buffer];
    this.buffer.length = 0;
    this.lastFlush = Date.now();
    return events;
  }

  summary(): TelemetrySummary {
    const categories: TelemetrySummary['categories'] = {};
    for (const [key, aggregate] of this.aggregates) {
      categories[key] = { ...aggregate };
    }

    return {
      totalEvents: [...this.aggregates.values()].reduce((sum, aggregate) => sum + aggregate.count, 0),
      categories
    };
  }

  private shouldFlush(): boolean {
    if (this.buffer.length >= this.maxBufferSize) {
      return true;
    }

    return Date.now() - this.lastFlush >= this.flushIntervalMs;
  }

  private updateAggregates(event: TelemetryEvent): void {
    const key = `${event.category}:${event.type}`;
    const aggregate = this.aggregates.get(key);

    if (!aggregate) {
      this.aggregates.set(key, {
        count: 1,
        lastEvent: event.timestamp,
        highestSeverity: event.severity
      });
      return;
    }

    aggregate.count += 1;
    aggregate.lastEvent = event.timestamp;

    if (severityPriority[event.severity] > severityPriority[aggregate.highestSeverity]) {
      aggregate.highestSeverity = event.severity;
    }
  }
}
