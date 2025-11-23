import { writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { EventEmitter } from 'events';

export interface LogEntry {
    timestamp: Date;
    level: 'INFO' | 'WARN' | 'ERROR';
    message: string;
    context?: any;
}

export interface TestLoggerConfig {
    logDir: string;
    consoleOutput?: boolean;
}

export class TestLogger extends EventEmitter {
    private logFile: string;

    constructor(private config: TestLoggerConfig) {
        super();
        if (!existsSync(config.logDir)) {
            mkdirSync(config.logDir, { recursive: true });
        }
        this.logFile = join(config.logDir, 'test.log');
    }

    log(message: string, level: 'INFO' | 'WARN' | 'ERROR' = 'INFO', context?: any): void {
        const entry: LogEntry = {
            timestamp: new Date(),
            level,
            message,
            context
        };
        
        const line = `[${entry.timestamp.toISOString()}] [${level}] ${message} ${context ? JSON.stringify(context) : ''}\n`;
        
        appendFileSync(this.logFile, line);
        if (this.config.consoleOutput) {
            console.log(line.trim());
        }
        this.emit('log', entry);
    }
}
