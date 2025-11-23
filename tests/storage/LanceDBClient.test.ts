import { LanceDBClient, VectorDocument } from '../../src/core/storage/LanceDBClient';
import * as path from 'path';
import * as fs from 'fs';

// Mock OpenAI embeddings for faster testing
jest.mock('openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      embeddings: {
        create: jest.fn().mockResolvedValue({
          data: [{
            embedding: new Array(1536).fill(0.1).map((_, i) => Math.sin(i) * 0.1)
          }]
        })
      }
    }))
  };
});

describe('LanceDBClient', () => {
  let client: LanceDBClient;
  let testDbPath: string;

  beforeEach(async () => {
    // Create temp directory for test database
    testDbPath = path.join('/tmp', `lancedb-test-${Date.now()}`);
    fs.mkdirSync(testDbPath, { recursive: true });
    
    client = new LanceDBClient(testDbPath);
    await client.initialize();
  });

  afterEach(async () => {
    await client.close();
    // Clean up test directory
    if (fs.existsSync(testDbPath)) {
      fs.rmSync(testDbPath, { recursive: true, force: true });
    }
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      expect(client).toBeDefined();
    });

    it('should handle double initialization', async () => {
      await expect(client.initialize()).resolves.not.toThrow();
    });

    it('should create table on first initialization', async () => {
      const stats = await client.getStats();
      expect(stats.count).toBe(0);
    });
  });

  describe('Document Operations', () => {
    it('should add a single document', async () => {
      const id = await client.addDocument('Test content', { category: 'test' });
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      
      const stats = await client.getStats();
      expect(stats.count).toBe(1);
    });

    it('should retrieve a document by ID', async () => {
      const content = 'Test document for retrieval';
      const metadata = { author: 'test-user', version: 1 };
      const id = await client.addDocument(content, metadata);
      
      const doc = await client.getDocument(id);
      expect(doc).not.toBeNull();
      expect(doc!.id).toBe(id);
      expect(doc!.content).toBe(content);
      expect(doc!.metadata).toEqual(metadata);
    });

    it('should return null for non-existent document', async () => {
      const doc = await client.getDocument('non-existent-id');
      expect(doc).toBeNull();
    });

    it('should update a document', async () => {
      const id = await client.addDocument('Original content', { version: 1 });
      
      await client.updateDocument(id, {
        content: 'Updated content',
        metadata: { version: 2 }
      });
      
      const updatedDoc = await client.getDocument(id);
      expect(updatedDoc!.content).toBe('Updated content');
      expect(updatedDoc!.metadata.version).toBe(2);
    });

    it('should delete a document', async () => {
      const id = await client.addDocument('Document to delete');
      
      await client.deleteDocument(id);
      
      const doc = await client.getDocument(id);
      expect(doc).toBeNull();
      
      const stats = await client.getStats();
      expect(stats.count).toBe(0);
    });
  });

  describe('Batch Operations', () => {
    it('should add multiple documents in batch', async () => {
      const documents = [
        { content: 'Doc 1', metadata: { index: 1 } },
        { content: 'Doc 2', metadata: { index: 2 } },
        { content: 'Doc 3', metadata: { index: 3 } },
        { content: 'Doc 4', metadata: { index: 4 } },
        { content: 'Doc 5', metadata: { index: 5 } }
      ];
      
      const ids = await client.addDocumentsBatch(documents);
      expect(ids).toHaveLength(5);
      expect(ids.every(id => typeof id === 'string')).toBe(true);
      
      const stats = await client.getStats();
      expect(stats.count).toBe(5);
    });

    it('should add 10+ documents in batch', async () => {
      const documents = Array.from({ length: 15 }, (_, i) => ({
        content: `Batch document ${i}`,
        metadata: { batchIndex: i, category: 'batch-test' }
      }));
      
      const ids = await client.addDocumentsBatch(documents);
      expect(ids).toHaveLength(15);
      
      const stats = await client.getStats();
      expect(stats.count).toBe(15);
    });

    it('should batch search multiple queries', async () => {
      // Add test documents
      await client.addDocumentsBatch([
        { content: 'JavaScript programming guide', metadata: { topic: 'js' } },
        { content: 'Python data analysis tutorial', metadata: { topic: 'python' } },
        { content: 'TypeScript type system', metadata: { topic: 'typescript' } }
      ]);
      
      const queries = ['JavaScript', 'Python', 'TypeScript'];
      const results = await client.searchBatch(queries);
      
      expect(results).toHaveLength(3);
      expect(results[0].length).toBeGreaterThan(0); // JavaScript results
      expect(results[1].length).toBeGreaterThan(0); // Python results
      expect(results[2].length).toBeGreaterThan(0); // TypeScript results
    });

    it('should batch delete documents', async () => {
      const ids = await client.addDocumentsBatch([
        { content: 'Doc to delete 1' },
        { content: 'Doc to delete 2' },
        { content: 'Doc to delete 3' }
      ]);
      
      expect(ids).toHaveLength(3);
      
      await client.deleteDocumentsBatch(ids);
      
      // Verify all deleted
      for (const id of ids) {
        const doc = await client.getDocument(id);
        expect(doc).toBeNull();
      }
      
      const stats = await client.getStats();
      expect(stats.count).toBe(0);
    });
  });

  describe('Search Operations', () => {
    beforeEach(async () => {
      await client.addDocumentsBatch([
        { content: 'Machine learning algorithms for data science', metadata: { category: 'ML', difficulty: 'advanced' } },
        { content: 'Python basics for beginners', metadata: { category: 'programming', difficulty: 'beginner' } },
        { content: 'Neural networks deep dive', metadata: { category: 'ML', difficulty: 'advanced', topic: 'neural-nets' } },
        { content: 'JavaScript web development', metadata: { category: 'programming', difficulty: 'intermediate', topic: 'web-dev' } }
      ]);
    });

    it('should search for similar documents', async () => {
      const results = await client.search('machine learning', 5);
      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].content).toContain('learning');
    });

    it('should search with metadata filter', async () => {
      const results = await client.searchWithFilter(
        'learning',
        { category: 'ML' },
        5
      );
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(doc => doc.metadata.category === 'ML')).toBe(true);
    });

    it('should search with complex metadata filter', async () => {
      const results = await client.searchWithFilter(
        'learning',
        { category: 'programming', difficulty: 'intermediate' },
        5
      );
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(doc => 
        doc.metadata.category === 'programming' && 
        doc.metadata.difficulty === 'intermediate'
      )).toBe(true);
    });

    it('should respect search limit', async () => {
      const results = await client.search('learning', 2);
      expect(results.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Index and Optimization', () => {
    it('should create index', async () => {
      await expect(client.createIndex('vector', 'cosine')).resolves.not.toThrow();
    });

    it('should optimize table', async () => {
      await expect(client.optimizeTable()).resolves.not.toThrow();
    });

    it('should report index status in stats', async () => {
      await client.createIndex();
      const stats = await client.getStats();
      expect(stats.isIndexed).toBe(true);
    });
  });

  describe('Statistics', () => {
    it('should get stats for empty table', async () => {
      const stats = await client.getStats();
      expect(stats.count).toBe(0);
      expect(stats.size).toBe(0);
      expect(stats.isIndexed).toBe(false);
    });

    it('should get stats with documents', async () => {
      await client.addDocumentsBatch([
        { content: 'Doc 1' },
        { content: 'Doc 2' },
        { content: 'Doc 3' }
      ]);
      
      const stats = await client.getStats();
      expect(stats.count).toBe(3);
      expect(stats.size).toBeGreaterThan(0);
    });
  });

  describe('Metadata Filtering', () => {
    beforeEach(async () => {
      await client.addDocumentsBatch([
        { content: 'Doc A', metadata: { category: 'A', priority: 1 } },
        { content: 'Doc B', metadata: { category: 'B', priority: 2 } },
        { content: 'Doc C', metadata: { category: 'A', priority: 3 } },
        { content: 'Doc D', metadata: { category: 'C', priority: 1 } }
      ]);
    });

    it('should filter by single metadata field', async () => {
      const results = await client.searchWithFilter('doc', { category: 'A' }, 10);
      expect(results.length).toBe(2);
      expect(results.every(r => r.metadata.category === 'A')).toBe(true);
    });

    it('should filter by numeric metadata', async () => {
      const results = await client.searchWithFilter('doc', { priority: 1 }, 10);
      expect(results.length).toBe(2);
      expect(results.every(r => r.metadata.priority === 1)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle search before initialization gracefully', async () => {
      const newClient = new LanceDBClient(testDbPath);
      // Don't initialize
      await expect(newClient.search('test')).rejects.toThrow();
    });

    it('should handle update of non-existent document', async () => {
      await expect(
        client.updateDocument('non-existent', { content: 'updated' })
      ).rejects.toThrow('Document not found');
    });

    it('should handle invalid input validation', async () => {
      await expect(
        // @ts-ignore - Testing invalid input
        client.addDocument(123)
      ).rejects.toThrow();
    });
  });

  describe('Pagination', () => {
    beforeEach(async () => {
      const docs = Array.from({ length: 25 }, (_, i) => ({
        content: `Test document ${i}`,
        metadata: { index: i }
      }));
      await client.addDocumentsBatch(docs);
    });

    it('should get all documents with limit', async () => {
      const docs = await client.getAllDocuments(10);
      expect(docs.length).toBe(10);
    });

    it('should paginate documents with offset', async () => {
      const page1 = await client.getAllDocuments(10, 0);
      const page2 = await client.getAllDocuments(10, 10);
      
      expect(page1[0].metadata.index).toBe(0);
      expect(page2[0].metadata.index).toBe(10);
    });
  });
});
