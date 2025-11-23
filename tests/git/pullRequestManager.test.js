"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const pullRequestManager_1 = require("../../src/git/pullRequestManager");
describe('PullRequestManager', () => {
    const fixturePath = path_1.default.resolve(__dirname, '__fixtures__/pullRequestsOpen.json');
    let tempFile;
    beforeEach(async () => {
        const contents = await fs_1.promises.readFile(fixturePath, 'utf8');
        tempFile = path_1.default.join(os_1.default.tmpdir(), `pull-requests-${Date.now()}.json`);
        await fs_1.promises.writeFile(tempFile, contents, 'utf8');
    });
    afterEach(async () => {
        await fs_1.promises.unlink(tempFile).catch(() => undefined);
    });
    it('closes deprecated PRs and merges current version fixes', async () => {
        const processed = await (0, pullRequestManager_1.managePullRequests)('3.0.0', tempFile);
        expect(processed).toHaveLength(3);
        const deprecated = processed.find(pr => pr.id === 42);
        expect(deprecated.status).toBe('closed');
        expect(deprecated.resolution).toBe('deprecated');
        expect(deprecated.branchDeleted).toBe(true);
        expect(deprecated.history?.some(entry => entry.type === 'closed')).toBe(true);
        const ignition = processed.find(pr => pr.id === 57);
        expect(ignition.status).toBe('merged');
        expect(ignition.checks.tests).toBe(true);
        expect(ignition.fixesApplied).toContainEqual(expect.stringContaining('media/ignition.js'));
        expect(ignition.branchDeleted).toBe(true);
        const apiTester = processed.find(pr => pr.id === 61);
        expect(apiTester.status).toBe('merged');
        expect(apiTester.checks.security).toBe(true);
        expect(apiTester.fixesApplied).toContainEqual(expect.stringContaining('apiTesterCore'));
    });
});
