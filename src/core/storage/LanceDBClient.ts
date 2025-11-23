import * as lancedb from '@lancedb/lancedb';
// Note: Assuming @lancedb/lancedb types are available. 
// If strictly checking types, we might need to rely on 'any' for some parts if external types are complex to mock.

export interface LanceDBConfig {
  tableName: string;
  vectorDimension: number;
}

export class LanceDBClient {
  private connection: any;
  private table: any;
  private initialized: boolean = false;

  constructor(private tableName: string, private dbPath: string = '/tmp/lancedb') {}

  async init(): Promise<void> {
    if (this.initialized) return;
    try {
      this.connection = await lancedb.connect(this.dbPath);
      this.initialized = true;
    } catch (error) {
      console.error('Failed to connect to LanceDB:', error);
      throw error;
    }
  }

  async ensureTable(data?: any[]): Promise<void> {
    if (!this.initialized) await this.init();
    try {
      const tables = await this.connection.tableNames();
      if (!tables.includes(this.tableName)) {
        if (data && data.length > 0) {
          this.table = await this.connection.createTable(this.tableName, data);
        } else {
          // Cannot create empty table without schema in some versions, 
          // but we'll assume we wait for first insert or create with empty data if supported.
          // For now, do nothing until insert.
        }
      } else {
        this.table = await this.connection.openTable(this.tableName);
      }
    } catch (error) {
      console.error('Error ensuring table:', error);
      throw error;
    }
  }

  async insert(data: any[]): Promise<void> {
    if (!this.initialized) await this.init();
    if (data.length === 0) return;

    if (!this.table) {
      await this.ensureTable(data);
    }

    if (this.table) {
      await this.table.add(data);
    } else {
        // If table didn't exist and ensureTable created it with data, we are good.
        // If ensureTable didn't create it (weird state), we try creating it now.
        this.table = await this.connection.createTable(this.tableName, data);
    }
  }

  async search(vector: number[], limit: number = 10): Promise<any[]> {
    if (!this.initialized) await this.init();
    if (!this.table) await this.ensureTable();
    if (!this.table) return []; // Table doesn't exist yet

    try {
       // LanceDB query API: table.search(vector).limit(limit).execute()
       const results = await this.table.search(vector).limit(limit).execute();
       return results;
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }

  async delete(predicate: string): Promise<void> {
     if (!this.initialized) await this.init();
     if (!this.table) await this.ensureTable();
     if (this.table) {
         await this.table.delete(predicate);
     }
  }

  async createIndex(config?: any): Promise<void> {
      if (!this.initialized) await this.init();
      if (!this.table) await this.ensureTable();
      if (this.table) {
          await this.table.createIndex(config);
      }
  }
  
  // Helper for tests
  isInitialized(): boolean {
      return this.initialized;
  }
}
