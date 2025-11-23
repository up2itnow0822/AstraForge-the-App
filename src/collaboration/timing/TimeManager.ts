import * as vscode from 'vscode';
// @ts-expect-error - import type mismatch
import { CollaborationTypes } from '../types/collaborationTypes';
import { Logger } from '../../utils/logger';

export class TimeManager {
private timeouts: Map<string, NodeJS.Timeout> = new Map();

setTimeout(sessionId: string, delay: number, callback: () => void): void {
const timeout = setTimeout(callback, delay);
this.timeouts.set(sessionId, timeout);
}

clearTimeout(sessionId: string): void {
const timeout = this.timeouts.get(sessionId);
if (timeout) {
clearTimeout(timeout);
this.timeouts.delete(sessionId);
}
}

clearAll(): void {
for (const timeout of this.timeouts.values()) {
clearTimeout(timeout);
}
this.timeouts.clear();
}
}
