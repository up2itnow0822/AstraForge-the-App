
export interface FileChangeSet {
    changes: Array<{
        path: string;
        action: 'create' | 'update' | 'delete';
        content: string;
    }>;
}
