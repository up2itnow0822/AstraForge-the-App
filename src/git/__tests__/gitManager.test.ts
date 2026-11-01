import { GitManager } from '../gitManager';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { simpleGit } from 'simple-git';

jest.mock('simple-git', () => ({
    simpleGit: jest.fn(),
}));

describe('GitManager', () => {
    let gitManager: GitManager;
    let mockGit: any;

    beforeEach(() => {
        mockGit = {
            add: jest.fn<any>().mockResolvedValue(''),
            commit: jest.fn<any>().mockResolvedValue({ commit: 'sha-123' }),
            status: jest.fn<any>().mockResolvedValue({ files: [] }),
            branch: jest.fn<any>().mockResolvedValue({ all: ['main'] }),
            push: jest.fn<any>().mockResolvedValue(null),
            pull: jest.fn<any>().mockResolvedValue(null)
        };
        (simpleGit as unknown as jest.Mock).mockReturnValue(mockGit);
        gitManager = new GitManager('/tmp/repo');
    });

    it('should commit changes', async () => {
        const result = await gitManager.commitChanges('msg');
        expect(mockGit.add).toHaveBeenCalledWith('.');
        expect(mockGit.commit).toHaveBeenCalledWith('msg');
        expect(result.commit).toBe('sha-123');
    });
    
    it('should handle commit with no commit hash returning unknown', async () => {
         mockGit.commit.mockResolvedValue({});
         const result = await gitManager.commitChanges('msg');
         expect(result.commit).toBe('unknown');
    });

    it('should get status', async () => {
        await gitManager.getRepositoryStatus();
        expect(mockGit.status).toHaveBeenCalled();
    });

    it('should list branches', async () => {
        await gitManager.listBranches();
        expect(mockGit.branch).toHaveBeenCalled();
    });

    it('should push changes successfully', async () => {
        const result = await gitManager.pushToRemote('main');
        expect(mockGit.push).toHaveBeenCalledWith('origin', 'main');
        expect(result).toBe(true);
    });

    it('trims leading whitespace on a normal branch before push', async () => {
        const result = await gitManager.pushToRemote('  main');
        expect(mockGit.push).toHaveBeenCalledWith('origin', 'main');
        expect(result).toBe(true);
    });

    it('rejects a --receive-pack=evil branch and never calls push', async () => {
        await expect(gitManager.pushToRemote('--receive-pack=evil')).rejects.toThrow(
            /must not start with '-'/
        );
        expect(mockGit.push).not.toHaveBeenCalled();
    });

    it('rejects a -x branch and never calls push', async () => {
        await expect(gitManager.pushToRemote('-x')).rejects.toThrow(
            /must not start with '-'/
        );
        expect(mockGit.push).not.toHaveBeenCalled();
    });

    it('trims leading whitespace then rejects a leading-dash branch', async () => {
        await expect(gitManager.pushToRemote('  -x')).rejects.toThrow(
            /must not start with '-'/
        );
        expect(mockGit.push).not.toHaveBeenCalled();
    });

    it('rejects a leading + force-refspec and never calls push', async () => {
        await expect(gitManager.pushToRemote('+main')).rejects.toThrow(
            /must not start with '\+'/
        );
        expect(mockGit.push).not.toHaveBeenCalled();
    });

    it('rejects a colon refspec and never calls push', async () => {
        await expect(gitManager.pushToRemote('HEAD:refs/heads/evil')).rejects.toThrow(
            /must not contain ':'/
        );
        expect(mockGit.push).not.toHaveBeenCalled();
    });

    it('should handle push errors return false', async () => {
        mockGit.push.mockRejectedValue(new Error('Push failed'));
        const result = await gitManager.pushToRemote('main');
        expect(result).toBe(false);
    });

    it('should pull changes successfully', async () => {
        const result = await gitManager.pullFromRemote('main');
        expect(mockGit.pull).toHaveBeenCalledWith('origin', 'main');
        expect(result).toBe(true);
    });

    it('rejects a -x branch on pull and never calls pull', async () => {
        await expect(gitManager.pullFromRemote('-x')).rejects.toThrow(
            /must not start with '-'/
        );
        expect(mockGit.pull).not.toHaveBeenCalled();
    });

    it('rejects a colon refspec on pull and never calls pull', async () => {
        await expect(gitManager.pullFromRemote('src:dst')).rejects.toThrow(
            /must not contain ':'/
        );
        expect(mockGit.pull).not.toHaveBeenCalled();
    });
    
    it('should handle pull errors return false', async () => {
        mockGit.pull.mockRejectedValue(new Error('Pull failed'));
        const result = await gitManager.pullFromRemote('main');
        expect(result).toBe(false);
    });
});
