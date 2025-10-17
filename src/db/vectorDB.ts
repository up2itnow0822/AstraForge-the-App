import * as lancedb from '@lancedb/lancedb';
import OpenAICompatibleProvider from '../llm/providers/OpenAICompatibleProvider';
import * as math from 'mathjs';

export interface Document {
  id: string;
  text: string;
  metadata?: any;
}

export interface SearchResult {
  text: string;
  metadata?: any;
  score: number;
}

export class VectorDB {
  private provider: OpenAICompatibleProvider;
  private client: any;
  private table: any;
  private corpus: Map<string, { text: string; terms: Set<string> }> = new Map();
  private termDf: Map<string, number> = new Map();
  private totalDocs = 0;
  private avgDl = 0;
  private readonly embeddingDim = 1536;
  private readonly alpha = 0.7; // Weight for cosine vs BM25

  constructor(provider: OpenAICompatibleProvider) {
    this.provider = provider;
  }

  async init(dbPath: string = '/tmp/astraforge.lancedb') {
    this.client = await lancedb.connect(dbPath);
    this.table = await this.client.openOrCreateTable('vectors', {
      schema: {
        id: new lancedb.SchemaField('string', lancedb.SchemaType.Utf8),
        vector: new lancedb.SchemaField('fixed_size_list', lancedb.SchemaType.Float32, {
          list_type: new lancedb.SchemaField('float', lancedb.SchemaType.Float32),
          list_len: this.embeddingDim,
        }),
        text: new lancedb.SchemaField('string', lancedb.SchemaType.Utf8),
        metadata: new lancedb.SchemaField('string', lancedb.SchemaType.Utf8), // JSON string
      },
      data: [],
    });
  }

  async upsert(docs: Document[]) {
    const embeddings = await Promise.all(docs.map(doc => this.provider.embed(doc.text)));
    const rows = docs.map((doc, index) => ({
      id: doc.id,
      vector: embeddings[index],
      text: doc.text,
      metadata: JSON.stringify(doc.metadata || {}),
    }));
    await this.table.add(rows);

    // Update BM25 index
    docs.forEach(doc => {
      const terms = this.extractTerms(doc.text);
      this.corpus.set(doc.id, { text: doc.text, terms });
      terms.forEach(term => {
        this.termDf.set(term, (this.termDf.get(term) || 0) + 1);
      });
    });
    this.totalDocs += docs.length;
    this.updateAvgDl();
  }

  async search(query: string, topK = 5, threshold = 0.7): Promise<SearchResult[]> {
    const queryEmbedding = await this.provider.embed(query);
    const vectorResults = await this.table
      .search(queryEmbedding)
      .metric('cosine')
      .limit(100)
      .toList();

    const qTerms = this.extractTerms(query);
    const hybridResults: { result: any; score: number; bm25: number }[] = [];

    for (const result of vectorResults as any[]) {
      const cosine = 1 - result._distance; // Normalize cosine distance
      let bm25Score = 0;

      if (this.corpus.has(result.id)) {
        const doc = this.corpus.get(result.id)!;
        const docTerms = doc.terms;
        const docDl = docTerms.size;

        qTerms.forEach(term => {
          const tf = Array.from(docTerms).filter(t => t === term).length;
          if (tf > 0) {
            const df = this.termDf.get(term) || 0;
            const idf = Math.log((this.totalDocs - df + 0.5) / (df + 0.5) + 1);
            const k = 1.2;
            const b = 0.75;
            bm25Score += (tf * idf) / (tf + k * (1 - b + b * (docDl / (this.avgDl || 1))));
          }
        });
      }

      const score = this.alpha * cosine + (1 - this.alpha) * (bm25Score / qTerms.length || 0);
      if (score > threshold) {
        hybridResults.push({
          result,
          score,
          bm25: bm25Score / qTerms.length || 0,
        });
      }
    }

    hybridResults.sort((a, b) => b.score - a.score);
    return hybridResults.slice(0, topK).map(({ result, score }) => ({
      text: result.text,
      metadata: JSON.parse(result.metadata || '{}'),
      score,
    }));
  }

  private extractTerms(text: string): Set<string> {
    return new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 1)
    );
  }

  private updateAvgDl() {
    let totalDl = 0;
    this.corpus.forEach(doc => {
      totalDl += doc.terms.size;
    });
    this.avgDl = this.totalDocs > 0 ? totalDl / this.totalDocs : 0;
  }
}
