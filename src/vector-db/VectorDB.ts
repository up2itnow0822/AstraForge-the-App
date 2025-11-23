export interface VectorDB {
    query(vector: number[]): Promise<any[]>;
    add(data: any): Promise<void>;
}

export class LanceDBVectorStore implements VectorDB {
    private store: any[] = [];

    async query(vector: number[]): Promise<any[]> {
        return this.store;
    }

    async add(data: any): Promise<void> {
        this.store.push(data);
    }
}
