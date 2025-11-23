export interface MetadataRecord {
  id: string;
  data: any;
  createdAt: number;
  updatedAt: number;
  schemaVersion: string;
}

export class MetadataDB {
  private metadata: Map<string, MetadataRecord> = new Map();
  private schemaVersion = '1.0.0';

  constructor(private dbPath: string = './metadata') {}

  async init(): Promise<void> {
    // Real implementation would load from disk/db
    console.log(`Initializing metadata database at ${this.dbPath}`);
  }

  async insert(id: string, data: any): Promise<boolean> {
    const existing = this.metadata.get(id);
    if (existing) return false;

    const record: MetadataRecord = {
      id,
      data: this.cloneData(data),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      schemaVersion: this.schemaVersion
    };

    this.metadata.set(id, record);
    return true;
  }

  async update(id: string, data: any): Promise<boolean> {
    const existing = this.metadata.get(id);
    if (!existing) return false;

    existing.data = this.cloneData(data);
    existing.updatedAt = Date.now();

    return true;
  }

  async get(id: string): Promise<MetadataRecord | undefined> {
    const record = this.metadata.get(id);
    return record ? this.cloneData(record) : undefined;
  }

  async delete(id: string): Promise<boolean> {
    return this.metadata.delete(id);
  }

  async query(criteria: any): Promise<MetadataRecord[]> {
    const results: MetadataRecord[] = [];

    for (const record of this.metadata.values()) {
      if (this.matchesCriteria(record, criteria)) {
        results.push(this.cloneData(record));
      }
    }

    return results;
  }

  async batchInsert(records: Array<{ id: string; data: any }>): Promise<number> {
    let inserted = 0;

    for (const record of records) {
      const success = await this.insert(record.id, record.data);
      if (success) inserted++;
    }

    return inserted;
  }

  private matchesCriteria(record: MetadataRecord, criteria: any): boolean {
    for (const [key, value] of Object.entries(criteria)) {
      if (record.data[key] !== value) return false;
    }
    return true;
  }

  private cloneData(data: any): any {
    return JSON.parse(JSON.stringify(data));
  }

  getCount(): number {
    return this.metadata.size;
  }

  exists(id: string): boolean {
    return this.metadata.has(id);
  }
}
