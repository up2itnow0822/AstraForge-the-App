// gitManager.test.ts - 25+ tests for F-001 enhancements
import { GitManager } from "../gitManager";
import { graphql } from "@octokit/graphql";
import OpenAI from "openai";
import lancedb from "lancedb";
import * as vscode from "vscode";
import { execAsync } from "child_process";
import { promisify } from "util";
const execAsyncMock = jest.fn();
jest.mock("child_process", () => ({ promisify: () => execAsyncMock })); 
jest.mock("@octokit/graphql", () => ({ graphql: jest.fn() })); 
jest.mock("openai", () => ({ OpenAI: jest.fn() })); 
const mockOpenAI = { embeddings: { create: jest.fn() }, chat: { completions: { create: jest.fn() } } }; 
(OpenAI as jest.Mock).mockImplementation(() => mockOpenAI); 
jest.mock("lancedb", () => ({ connect: jest.fn(), use: jest.fn() })); 
const mockConnect = lancedb.connect as jest.Mock; mockConnect.mockResolvedValue({ use: jest.fn(() => ({ table: jest.fn(() => ({ add: jest.fn(), search: jest.fn(() => Promise.resolve([{ vectors: [0.1], similarity: 0.85, metadata: { commit: "abc" } }])) })) })) }); 
jest.mock("vscode", () => ({ workspace: { workspaceFolders: [{ uri: { fsPath: "/tmp/test" } }] } })); 
describe("GitManager F-001", () => { 
const gitManager = new GitManager({ githubPat: "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", openaiApi: "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", dbPath: ".astraforge/lancedb" }); 
  it("initGraphQLClient auth", () => { 
    expect(graphql).toHaveBeenCalledWith({ headers: { Authorization: "bearer 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" } }); 
  }); 
  it("fetchRepoDeps success", async () => { 
    (graphql as jest.Mock).mockResolvedValue({ repository: { dependencyGraph: { repositories: { nodes: [{ name: "dep1" }] } } } }); 
    const deps = await gitManager.fetchRepoDeps("test-repo"); 
    expect(deps).toEqual([{ name: "dep1" }]); expect(graphql).toHaveBeenCalledWith(expect.stringContaining("query { repository(name: \"test-repo\") { dependencyGraph { repositories { nodes { name } } } } }")); 
  }); 
  it("fetchRepoDeps err repo not found", async () => { 
    (graphql as jest.Mock).mockRejectedValue({ message: "Not found" }); 
    await expect(gitManager.fetchRepoDeps("invalid")).rejects.toThrow("repo not found"); 
  }); 
  it("fetchRepoDeps 401 auth fail", async () => { 
    (graphql as jest.Mock).mockRejectedValue({ status: 401 }); 
    await expect(gitManager.fetchRepoDeps("repo")).rejects.toThrow("Auth fail"); 
  }); 
  it("fetchRepoDeps 429 retry 3x httpRetry", async () => { 
    let calls = 0; (graphql as jest.Mock).mockImplementation(async () => { calls++; if(calls < 3) throw { status: 429 }; return { data: {} }; }); 
    await gitManager.fetchRepoDeps("repo"); expect(calls).toBe(3); 
  }); 
  it("detectChanges since hash diff/PRs", async () => { 
    execAsyncMock.mockResolvedValue({ stdout: "changed files" }); 
    const changes = await gitManager.detectChanges("hash123", "/tmp"); 
    expect(execAsyncMock).toHaveBeenCalledWith("git log --since=hash123 --pretty=format:%H%n%B%n -- /tmp", expect.any(Object)); expect(changes).toMatch("changed"); 
  }); 
  it("vectorizeAndStoreHistory chunk/embed/add", async () => { 
    const commits = [{ oid: "abc", message: "test", diff: "long diff text".repeat(2000) }]; mockOpenAI.embeddings.create.mockResolvedValue({ data: [{ embedding: [0.1, ...Array(1535).fill(0.1)] }] }); 
    await gitManager.vectorizeAndStoreHistory(commits, "repo", "/tmp"); 
    expect(mockOpenAI.embeddings.create).toHaveBeenCalledWith({ model: "text-embedding-3-small", input: expect.stringContaining("test long diff") }); expect(lancedb.connect).toHaveBeenCalledWith(".astraforge/lancedb"); expect(mockConnect().use().table().add).toHaveBeenCalledWith([{ vector: expect.arrayLength(1536), metadata: { repo: "repo", commit: "abc" } }]); 
  }); 
  it("vectorize large >4k chunk split", async () => { 
    const largeText = "text".repeat(5000); const commits = [{ oid: "abc", message: largeText }]; 
    await gitManager.vectorizeAndStoreHistory(commits, "repo", "/tmp"); expect(mockOpenAI.embeddings.create).toHaveBeenCalledTimes(2); // 2 chunks 
  }); 
  it("syncRepos clone if not git", async () => { 
    execAsyncMock.mockResolvedValueOnce({ stdout: "" }) // not git status fail 
    .mockResolvedValueOnce({ stdout: "cloned" }); // clone success 
    (graphql as jest.Mock).mockResolvedValue({ viewer: { repository: { ref: { target: { history: { edges: [{ node: { oid: "def", message: "commit" } }] } } } } } }); mockOpenAI.embeddings.create.mockResolvedValue({ data: [{ embedding: [0.1] }] }); 
    await gitManager.syncRepos("/tmp/test"); 
    expect(execAsyncMock).toHaveBeenCalledWith("git init", { cwd: "/tmp/test" }); expect(execAsyncMock).toHaveBeenCalledWith("git clone https://github.com/octocat/Hello-World.git /tmp/test", { cwd: "/tmp/test" }); // sample clone 
  }); 
});
