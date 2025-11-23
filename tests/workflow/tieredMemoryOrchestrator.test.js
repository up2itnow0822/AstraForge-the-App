"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const telemetryPipeline_1 = require("../../src/workflow/telemetryPipeline");
const tieredMemoryOrchestrator_1 = require("../../src/workflow/tieredMemoryOrchestrator");
class FakeVectorDB {
    constructor() {
        this.stored = [];
    }
    async addDocument(key, content, metadata) {
        this.stored.push({ key, content, metadata });
    }
}
describe('TieredMemoryOrchestrator', () => {
    it('captures events across tiers and persists long term memories', async () => {
        const vectorDB = new FakeVectorDB();
        const telemetry = new telemetryPipeline_1.TelemetryPipeline();
        const orchestrator = new tieredMemoryOrchestrator_1.TieredMemoryOrchestrator(vectorDB, telemetry, { workspaceId: 'workspace_test' });
        await orchestrator.capture({ category: 'note', content: 'short memory', importance: 0.2 });
        await orchestrator.capture({ category: 'working', content: 'working memory', importance: 0.5 });
        await orchestrator.capture({ category: 'long', content: 'important memory', importance: 0.9 });
        const snapshot = orchestrator.getSnapshot();
        expect(snapshot).toHaveLength(3);
        expect(snapshot.find(record => record.category === 'long')).toBeDefined();
        expect(vectorDB.stored.some(entry => entry.content === 'important memory')).toBe(true);
    });
    it('promotes records between tiers', async () => {
        const vectorDB = new FakeVectorDB();
        const telemetry = new telemetryPipeline_1.TelemetryPipeline();
        const orchestrator = new tieredMemoryOrchestrator_1.TieredMemoryOrchestrator(vectorDB, telemetry, { workspaceId: 'workspace_test' });
        const record = await orchestrator.capture({ category: 'note', content: 'promote me', importance: 0.3 });
        orchestrator.promote(record.id, 'short', 'working');
        const snapshot = orchestrator.getSnapshot();
        const promoted = snapshot.find(item => item.id === record.id);
        expect(promoted?.tier).toBe('working');
    });
});
