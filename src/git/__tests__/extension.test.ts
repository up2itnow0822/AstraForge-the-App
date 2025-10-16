// extension.test.ts - 10+ tests for sync on activation
import * as vscode from "vscode";
import { ensureGitManager } from "../../extension";
import { GitManager } from "../git/gitManager";
jest.mock("vscode", () => ({ workspace: { workspaceFolders: [{ uri: { fsPath: "/tmp/test" } }] } })); 
jest.mock("../git/gitManager", () => ({ GitManager: jest.fn() })); 
describe("Extension F-001 sync", () => { 
  it("activate calls syncRepos", async () => { const mockGit = { syncRepos: jest.fn().mockResolvedValue([{ similarity: 0.85 }]) }; (GitManager as jest.Mock).mockImplementation(() => mockGit); 
    await activate({ extensionUri: {} } as any); // mock context 
    expect(GitManager).toHaveBeenCalledWith({ githubPat: "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", openaiApi: "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" }); 
    expect(mockGit.syncRepos).toHaveBeenCalledWith("/tmp/test"); 
  }); 
  it("syncRepos LLM build plan w/context", async () => { const mockOpenAI = { chat: { completions: { create: jest.fn().mockResolvedValue({ choices: [{ message: { content: "Mock build plan for Hello-World repo using context: commits abc similarity 0.85" } }] }) } } }; 
    const gitManager = new GitManager({ ... }); await gitManager.syncRepos("/tmp/test"); // assume clone/fetch/embed done, context returned 
    expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({ model: "gpt-4o-mini", messages: [{ role: "user", content: expect.stringContaining("Build plan for repo using infinite context:") }], apiKey: "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" }); 
  }); 
  it("no folders warn", async () => { (vscode.workspace as any).workspaceFolders = []; 
    // mock activate no sync 
    expect(vscode.window.showWarningMessage).toHaveBeenCalledWith("No workspace for Git sync"); 
  }); 
  it("rate limit retry openai", async () => { mockOpenAI.chat.completions.create.mockRejectedValueOnce({ status: 429 }); await gitManager.syncRepos("/tmp/test"); expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(3); 
  }); 
});
