import * as vscode from 'vscode';

export class Logger {
    private name: string;

    constructor(name: string = 'Global') {
        this.name = name;
    }

    public info(message: string): void {
        console.log(`[INFO][${this.name}] ${message}`);
    }

    public warn(message: string): void {
        console.warn(`[WARN][${this.name}] ${message}`);
    }

    public error(message: string): void {
        console.error(`[ERROR][${this.name}] ${message}`);
    }

    public log(message: string): void {
        console.log(`[LOG][${this.name}] ${message}`);
    }
}

export const logger = new Logger();
