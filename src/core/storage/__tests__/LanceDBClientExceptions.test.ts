// @ts-nocheck
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { LanceDBClient } from '../LanceDBClient';
import * as lancedb from '@lancedb/lancedb';

jest.mock('@lancedb/lancedb');
jest.unmock('../LanceDBClient');

describe('LanceDBClient Exceptions & Edge Cases', () => {
  let client;
  let mockConnect;
  let mockConnection;
  let mockTable;

  beforeEach(() => {
     // Reset mocks
     mockTable = {
       add: jest.fn(),
       search: jest.fn().mockReturnThis(),
       limit: jest.fn().mockReturnThis(),
       execute: jest.fn(),
       delete: jest.fn(),
       createIndex: jest.fn()
     };

     mockConnection = {
       tableNames: jest.fn(),
       openTable: jest.fn(),
       createTable: jest.fn()
     };

     // IMPORTANT: Match the default client table name 'test_table' so ensureTable works properly
     mockConnection.tableNames.mockResolvedValue(['test_table']);
     mockConnection.openTable.mockResolvedValue(mockTable);
     mockConnection.createTable.mockResolvedValue(mockTable);
     
     mockConnect = lancedb.connect;
     mockConnect.mockResolvedValue(mockConnection);
     
     client = new LanceDBClient('test_table');
  });

  it('should handle connection error', async () => {
    mockConnect.mockRejectedValue(new Error('Connection failed'));
    await expect(client.init()).rejects.toThrow('Connection failed');
  });

  it('should create table if not exists with data check', async () => {
     client = new LanceDBClient('new_table');
     mockConnection.tableNames.mockResolvedValue([]); 
     
     // CASE 1: ensureTable with data -> creates table
     await client.ensureTable([{ id: 1 }]);
     expect(mockConnection.createTable).toHaveBeenCalledWith('new_table', [{ id: 1 }]);
     
     // CASE 2: ensureTable without data -> does not create table
     mockConnection.createTable.mockClear();
     await client.ensureTable();
     expect(mockConnection.createTable).not.toHaveBeenCalled();
  });

  it('should handle ensureTable error', async () => {
      mockConnect.mockResolvedValue(mockConnection);
      mockConnection.tableNames.mockRejectedValue(new Error('Table list failed'));
      await expect(client.ensureTable()).rejects.toThrow('Table list failed');
  });
  
  it('should handle search error', async () => {
      mockTable.execute.mockRejectedValue(new Error('Search error'));
      const results = await client.search([0.1]);
      expect(results).toEqual([]);
  });

  it('should insert data and handle creation if table missing mid-flight', async () => {
      client = new LanceDBClient('missing_table');
      mockConnection.tableNames.mockResolvedValue([]);
      // table is undefined initially
      
      // insert data -> triggers ensureTable -> creates table if data present
      await client.insert([{ id: 1 }]);
      expect(mockConnection.createTable).toHaveBeenCalled();
  });

  it('should create index', async () => {
      mockConnection.tableNames.mockResolvedValue(['test_table']);
      await client.createIndex({ columns: ['id'] });
      expect(mockTable.createIndex).toHaveBeenCalled(); 
  });

  it('should handle delete', async () => {
      mockConnection.tableNames.mockResolvedValue(['test_table']);
      await client.delete('id = 1');
      expect(mockTable.delete).toHaveBeenCalledWith('id = 1');
  });
});
