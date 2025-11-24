export interface VectorDocument {
id: string;
content: string;
embedding: number[];
metadata?: Record<string, any>;
}

export class VectorDB {
private documents: Map<string, VectorDocument> = new Map();
private storagePath: string;
private initialized: boolean = false;

/**
 *
 * @param storagePath
 */
constructor(storagePath: string = './vectors') {
this.storagePath = storagePath;
}

/**
 *
 */
async init(): Promise<void> {
if (this.initialized) return;

// In real implementation, would load from disk
this.initialized = true;
}

/**
 *
 */
async close(): Promise<void> {
// In real implementation, would save to disk
this.initialized = false;
}

/**
 *
 * @param document
 */
async add(document: VectorDocument): Promise<void> {
if (!this.initialized) {
throw new Error('VectorDB not initialized');
}

this.documents.set(document.id, document);
}

/**
 *
 * @param embedding
 * @param limit
 */
async search(embedding: number[], limit: number = 10): Promise<Array<{ document: VectorDocument; similarity: number }>> {
if (!this.initialized) {
throw new Error('VectorDB not initialized');
}

const results: Array<{ document: VectorDocument; similarity: number }> = [];

for (const doc of this.documents.values()) {
const similarity = this.cosineSimilarity(embedding, doc.embedding);
results.push({ document: doc, similarity });
}

return results
.sort((a, b) => b.similarity - a.similarity)
.slice(0, limit);
}

/**
 *
 * @param a
 * @param b
 */
private cosineSimilarity(a: number[], b: number[]): number {
if (a.length !== b.length) return 0;

let dotProduct = 0;
let normA = 0;
let normB = 0;

for (let i = 0; i < a.length; i++) {
dotProduct += a[i] * b[i];
normA += a[i] * a[i];
normB += b[i] * b[i];
}

const denominator = Math.sqrt(normA) * Math.sqrt(normB);
return denominator === 0 ? 0 : dotProduct / denominator;
}

/**
 *
 */
async clear(): Promise<void> {
this.documents.clear();
}

/**
 *
 */
isInitialized(): boolean {
return this.initialized;
}

/**
 *
 */
getCount(): number {
return this.documents.size;
}
}
