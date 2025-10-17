import { LRUCache } from 'lru-cache';
import { ConsensusResult } from './interfaces';

type LRUOptions = LRUCache.Options<string, ConsensusResult>;

export class LLMCache {
  private cache: LRUCache<string, ConsensusResult>;

  constructor(options: LRUOptions = { ttl: 5 * 60 * 1000, max: 1000, updateAgeOnGet: true }) {
    this.cache = new LRUCache(options);
  }

  set(key: string, value: ConsensusResult): this {
    value.timestamp = Date.now();
    this.cache.set(key, value);
    return this;
  }

  get(key: string): ConsensusResult | undefined {
    const value = this.cache.get(key);
    if (value && Date.now() - (value.timestamp || 0) > 5 * 60 * 1000) {
      this.cache.delete(key);
      return undefined;
    }
    return value;
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}
