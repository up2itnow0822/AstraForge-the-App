import * as vscode from 'vscode';
import { Logger } from '../utils/logger';

export class ProjectIgnition {
    private logger: Logger;

    constructor() {
        this.logger = new Logger('ProjectIgnition');
    }

    public async ignite(config: any): Promise<boolean> {
        this.logger.info('Igniting project with config: ' + JSON.stringify(config));
        return true;
    }

    public async generateScaffold(type: string): Promise<void> {
        this.logger.info(`Generating scaffold for ${type}`);
    }
}
