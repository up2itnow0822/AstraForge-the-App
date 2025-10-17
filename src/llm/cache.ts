import { LRUCache } from 'lru-cache';
import { ConsensusResult } from './interfaces';

export class LLMCache extends LRUCache<string, ConsensusResult> {
  constructor(options?: LRUCache.Options<string, ConsensusResult>) {
    super({
      max: 100,
      ttl: 30 * 60 * 1000, // 30 min
      ...options,
    });
  }

  set(key: string, value: ConsensusResult): void {
    value.timestamp = Date.now();
    super.set(key, value);
  }

  evictTTL(ttl: number): void {
    for (const [key, value] of this.entries()) {
      if (Date.now() - (value.timestamp || 0) > ttl) {
        this.delete(key);
      }
    }
  }
}
