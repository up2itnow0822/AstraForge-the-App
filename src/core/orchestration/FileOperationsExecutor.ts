
import { promises as fs } from 'fs';
import { FileChangeSet } from './FileChangeSet';
import * as path from 'path';

export class FileOperationsExecutor {
    private readonly blockedFiles = ['.env', 'package.json', 'package-lock.json', 'yarn.lock'];

    async execute(changeSet: FileChangeSet): Promise<void> {
        console.log(`Executing change set with ${changeSet.changes.length} operations.`);

        for (const change of changeSet.changes) {
            // Security check
            const fileName = path.basename(change.path);
            if (this.blockedFiles.includes(fileName)) {
                console.error(`Security blocked: Attempt to modify sensitive file ${change.path}`);
                continue; // Skip restricted files
            }

            // Ensure absolute path safety (prevent directory traversal attacks ideally, but strictly following spec for now)

            try {
                switch (change.action) {
                    case 'create':
                    case 'update':
                        await this.ensureDirectoryExists(change.path);
                        await fs.writeFile(change.path, change.content, 'utf8');
                        console.log(`Successfully wrote to ${change.path}`);
                        break;
                    case 'delete':
                        try {
                            await fs.unlink(change.path);
                            console.log(`Deleted ${change.path}`);
                        } catch (err: any) {
                             if (err.code !== 'ENOENT') throw err;
                        }
                        break;
                }
            } catch (error) {
                console.error(`Failed to execute ${change.action} on ${change.path}:`, error);
                throw error;
            }
        }
    }

    private async ensureDirectoryExists(filePath: string): Promise<void> {
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
    }
}
