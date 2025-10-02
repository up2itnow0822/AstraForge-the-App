/* eslint-disable no-console */

/**
 * Lightweight logger wrapper to centralize logging and avoid console.* lint warnings.
 * Allows level-based filtering via LOG_LEVEL env (error|warn|info|debug).
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const levelOrder: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const envLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
const currentLevel = levelOrder[envLevel] ?? levelOrder.info;

function shouldLog(level: LogLevel): boolean {
  return levelOrder[level] <= currentLevel;
}

function emit(level: LogLevel, method: 'error' | 'warn' | 'info' | 'debug', args: unknown[]): void {
  if (!shouldLog(level)) {
    return;
  }

  (console[method] as (...logArgs: unknown[]) => void)(...args);
}

export const logger = {
  error(...args: unknown[]): void {
    emit('error', 'error', args);
  },
  warn(...args: unknown[]): void {
    emit('warn', 'warn', args);
  },
  info(...args: unknown[]): void {
    emit('info', 'info', args);
  },
  debug(...args: unknown[]): void {
    emit('debug', 'debug', args);
  },
};

export const _logger = logger;

/* eslint-enable no-console */


