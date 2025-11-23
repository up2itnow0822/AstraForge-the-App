jest.unmock('../LanceDBClient');
import { LanceDBClient } from '../LanceDBClient';
import * as lancedb from '@lancedb/lancedb';

jest.mock('@lancedb/lancedb', () => ({
  connect: jest.fn(),
}));

describe('LanceDBClient', () => {
  let client: LanceDBClient;
  let mockConnect: jest.Mock;
  let mockConnection: any;
  let mockTable: any;

  beforeEach(() => {
    mockTable = {
      add: jest.fn(),
      search: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue([]),
      delete: jest.fn(),
      createIndex: jest.fn(),
    };

    mockConnection = {
      tableNames: jest.fn().mockResolvedValue(['test_table']),
      createTable: jest.fn().mockResolvedValue(mockTable),
      openTable: jest.fn().mockResolvedValue(mockTable),
    };

    mockConnect = lancedb.connect as jest.Mock;
    mockConnect.mockResolvedValue(mockConnection);

    client = new LanceDBClient('test_table');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should init connection once', async () => {
    await client.init();
    await client.init();
    expect(mockConnect).toHaveBeenCalledTimes(1);
    expect(client.isInitialized()).toBe(true);
  });

  it('should ensure table creation if not exists', async () => {
    mockConnection.tableNames.mockResolvedValue([]);
    await client.ensureTable([{ id: 1 }]);
    expect(mockConnection.createTable).toHaveBeenCalledWith('test_table', [{ id: 1 }]);
  });

  it('should open table if exists', async () => {
    await client.ensureTable();
    expect(mockConnection.openTable).toHaveBeenCalledWith('test_table');
    // Verify table is set
    // @ts-ignore
    expect(client.table).toBe(mockTable);
  });

  it('should insert data', async () => {
    mockConnection.tableNames.mockResolvedValue([]);
    await client.insert([{ id: 1 }]);
    expect(mockConnection.createTable).toHaveBeenCalled(); 
  });

  it('should append data if table exists', async () => {
    // Ensure table is open first to mimic state or let insert handle it via default exists
    await client.insert([{ id: 2 }]);
    expect(mockTable.add).toHaveBeenCalledWith([{ id: 2 }]);
  });

  it('should search data', async () => {
    // Explicitly ensure table to debug
    await client.ensureTable();
    await client.search([0.1, 0.2]);
    expect(mockTable.search).toHaveBeenCalledWith([0.1, 0.2]);
    expect(mockTable.execute).toHaveBeenCalled();
  });

  it('should delete data', async () => {
    await client.ensureTable();
    await client.delete('id = 1');
    expect(mockTable.delete).toHaveBeenCalledWith('id = 1');
  });

  it('should create index', async () => {
    await client.ensureTable();
    await client.createIndex({ ivf_pq: true });
    expect(mockTable.createIndex).toHaveBeenCalledWith({ ivf_pq: true });
  });
});
