import { VectorDB } from '../db/vectorDB';
import { TelemetryPipeline, TelemetrySeverity } from './telemetryPipeline';

export type MemoryTier = 'short' | 'working' | 'long';

export interface MemoryEvent {
  category: string;
  content: string;
  importance?: number;
  tags?: string[];
  tierHint?: MemoryTier;
  metadata?: Record<string, unknown>;
}

interface MemoryRecord {
  id: string;
  category: string;
  tier: MemoryTier;
  content: string;
  importance: number;
  createdAt: number;
  lastAccessed: number;
  tags: string[];
  metadata?: Record<string, unknown>;
}

const tierLimits: Record<MemoryTier, number> = {
  short: 25,
  working: 60,
  long: 200
};

const tierSeverity: Record<MemoryTier, TelemetrySeverity> = {
  short: 'info',
  working: 'warning',
  long: 'info'
};

export class TieredMemoryOrchestrator {
  private readonly tiers: Record<MemoryTier, Map<string, MemoryRecord>> = {
    short: new Map(),
    working: new Map(),
    long: new Map()
  };

  constructor(
    private readonly vectorDB: VectorDB,
    private readonly telemetry: TelemetryPipeline,
    private readonly options: { workspaceId: string }
  ) {}

  async capture(event: MemoryEvent): Promise<MemoryRecord> {
    const tier = this.resolveTier(event);
    const now = Date.now();
    const record: MemoryRecord = {
      id: `${tier}_${now}_${Math.random().toString(36).slice(2, 6)}`,
      category: event.category,
      tier,
      content: event.content,
      importance: Math.max(0, Math.min(1, event.importance ?? 0.5)),
      createdAt: now,
      lastAccessed: now,
      tags: event.tags ?? [],
      metadata: event.metadata
    };

    this.tiers[tier].set(record.id, record);
    this.trimTier(tier);
    await this.persistIfLongTerm(record);

    this.telemetry.record({
      category: 'memory',
      type: `capture-${record.category}`,
      severity: tierSeverity[tier],
      message: `Captured ${record.category} in ${tier} tier`,
      data: {
        tier,
        importance: record.importance,
        workspaceId: this.options.workspaceId,
        tags: record.tags
      }
    });

    return record;
  }

  promote(recordId: string, fromTier: MemoryTier, toTier: MemoryTier): void {
    const record = this.tiers[fromTier].get(recordId);
    if (!record || fromTier === toTier) {
      return;
    }

    this.tiers[fromTier].delete(recordId);
    record.tier = toTier;
    record.lastAccessed = Date.now();
    this.tiers[toTier].set(record.id, record);
    this.trimTier(toTier);

    this.telemetry.record({
      category: 'memory',
      type: 'promotion',
      severity: 'warning',
      message: `Promoted ${record.category} from ${fromTier} to ${toTier}`,
      data: { recordId, fromTier, toTier }
    });
  }

  getSnapshot(): Array<Omit<MemoryRecord, 'content'>> {
    return (['short', 'working', 'long'] as MemoryTier[])
      .flatMap(tier => Array.from(this.tiers[tier].values()))
      .map(({ content: _content, ...rest }) => rest);
  }

  private resolveTier(event: MemoryEvent): MemoryTier {
    if (event.tierHint) {
      return event.tierHint;
    }

    const importance = event.importance ?? 0.5;
    if (importance >= 0.75) {
      return 'long';
    }
    if (importance >= 0.45) {
      return 'working';
    }
    return 'short';
  }

  private trimTier(tier: MemoryTier): void {
    const records = this.tiers[tier];
    const limit = tierLimits[tier];
    if (records.size <= limit) {
      return;
    }

    const ordered = Array.from(records.values()).sort((a, b) => {
      if (a.importance !== b.importance) {
        return a.importance - b.importance;
      }
      return a.lastAccessed - b.lastAccessed;
    });

    const overflow = ordered.slice(0, records.size - limit);
    overflow.forEach(record => records.delete(record.id));
  }

  private async persistIfLongTerm(record: MemoryRecord): Promise<void> {
    if (record.tier !== 'long') {
      return;
    }

    try {
      await this.vectorDB.addDocument(
        `memory_${this.options.workspaceId}_${record.id}`,
        record.content,
        {
          category: record.category,
          tags: record.tags,
          importance: record.importance,
          createdAt: new Date(record.createdAt).toISOString(),
          workspaceId: this.options.workspaceId,
          metadata: record.metadata
        }
      );
    } catch (error) {
      this.telemetry.record({
        category: 'memory',
        type: 'persist-failed',
        severity: 'error',
        message: 'Failed to persist long-term memory record',
        data: { recordId: record.id, error: error instanceof Error ? error.message : 'unknown' }
      });
    }
  }
}
