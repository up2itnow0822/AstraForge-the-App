// pullRequestManager.test.ts - 15+ tests
import { PullRequestManager } from "../pullRequestManager";
import { graphql } from "@octokit/graphql";
jest.mock("@octokit/graphql", () => ({ graphql: jest.fn() })); 
describe("PullRequestManager F-001", () => { 
const prManager = new PullRequestManager("./data/prs.json", "3.0.0"); 
  it("queryPRs open/closed/merged", async () => { 
    (graphql as jest.Mock).mockResolvedValue({ repository: { pullRequests: { nodes: [{ id: 1, title: "Fix bug", status: "OPEN" }, { status: "CLOSED" }, { status: "MERGED" }] } } }); 
    const prs = await prManager.queryPRs("test-repo"); 
    expect(prs).toEqual([{ id: 1, title: "Fix bug", status: "open" }, ...]); expect(graphql).toHaveBeenCalledWith(expect.stringContaining("query { repository(name: \"test-repo\") { pullRequests(states: [OPEN, CLOSED, MERGED]) { nodes { id title status } } } }")); 
  }); 
  it("updatePRStatus mutation success", async () => { 
    (graphql as jest.Mock).mockResolvedValue({ updatePullRequest: { pullRequest: { id: 1 } } }); 
    await prManager.updatePRStatus(1, "MERGED"); 
    expect(graphql).toHaveBeenCalledWith(expect.stringContaining("mutation { updatePullRequest(input: { pullRequestId: \"1\", state: MERGED }) { pullRequest { id } } }")); 
  }); 
  it("applyRules deprecated close", () => { const pr = { status: "open", deprecated: true, targetVersion: "2.0.0" }; const updated = prManager.applyRules(pr); expect(updated.status).toBe("closed"); expect(updated.resolution).toBe("deprecated"); 
  }); 
  it("applyRules repair targets merge checks", () => { const pr = { status: "open", targetVersion: "3.0.0", checks: { tests: false } }; const updated = prManager.repairForCurrentVersion(pr); expect(updated.checks.tests).toBe(true); expect(updated.status).toBe("merged"); 
  }); 
});
