import * as vscode from 'vscode';

export class Logger {
    private name: string;

    /**
     *
     * @param name
     */
    constructor(name: string = 'Global') {
        this.name = name;
    }

    /**
     *
     * @param message
     */
    public info(message: string): void {
        console.log(`[INFO][${this.name}] ${message}`);
    }

    /**
     *
     * @param message
     */
    public warn(message: string): void {
        console.warn(`[WARN][${this.name}] ${message}`);
    }

    /**
     *
     * @param message
     */
    public error(message: string): void {
        console.error(`[ERROR][${this.name}] ${message}`);
    }

    /**
     *
     * @param message
     */
    public log(message: string): void {
        console.log(`[LOG][${this.name}] ${message}`);
    }
}

export const logger = new Logger();
