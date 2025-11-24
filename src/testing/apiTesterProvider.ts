import { TestingTypes } from './types';
import { APITester } from './apiTesterCore';
import { LanceDBClient } from '../core/storage/LanceDBClient';

export class ApiTesterProvider {
    private testers: Map<string, APITester> = new Map();

    /**
     *
     * @param dbClient
     */
    constructor(private dbClient: LanceDBClient) {}

    /**
     *
     * @param id
     */
    getTester(id: string): APITester {
        if (!this.testers.has(id)) {
            this.testers.set(id, new APITester(this.dbClient));
        }
        return this.testers.get(id)!;
    }
}
