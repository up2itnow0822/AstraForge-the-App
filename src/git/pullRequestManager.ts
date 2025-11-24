export interface PullRequest {
    id: number;
    title: string;
    body: string;
    head: string;
    base: string;
    state: 'open' | 'closed' | 'merged';
}

export class PullRequestManager {
    /**
     *
     * @param title
     * @param body
     * @param head
     * @param base
     */
    async createPullRequest(title: string, body: string, head: string, base: string): Promise<PullRequest> {
        // Stub implementation
        return {
            id: Math.floor(Math.random() * 1000),
            title,
            body,
            head,
            base,
            state: 'open'
        };
    }

    /**
     *
     * @param id
     */
    async getPullRequest(id: number): Promise<PullRequest | null> {
        // Stub implementation
        return {
            id,
            title: 'Stub PR',
            body: 'Stub Body',
            head: 'feature',
            base: 'main',
            state: 'open'
        };
    }
}
