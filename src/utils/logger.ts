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

export const logger = {
    error(message?: unknown, ...optionalParams: unknown[]): void {
      if (shouldLog('error')) {
        console.error(message as any, ...optionalParams as any[]);
      }
    },
    warn(message?: unknown, ...optionalParams: unknown[]): void {
      if (shouldLog('warn')) {
        console.warn(message as any, ...optionalParams as any[]);
      }
    },
    info(message?: unknown, ...optionalParams: unknown[]): void {
      if (shouldLog('info')) {
        console.log(message as any, ...optionalParams as any[]);
      }
    },
    debug(message?: unknown, ...optionalParams: unknown[]): void {
      if (shouldLog('debug')) {
        console.debug(message as any, ...optionalParams as any[]);
      }
    },
  };

  export const _logger = {
    error(message?: unknown, ...optionalParams: unknown[]): void {
      if (shouldLog('error')) {
        console.error(message as any, ...optionalParams as any[]);
      }
    },
    warn(message?: unknown, ...optionalParams: unknown[]): void {
      if (shouldLog('warn')) {
        console.warn(message as any, ...optionalParams as any[]);
      }
    },
    info(message?: unknown, ...optionalParams: unknown[]): void {
      if (shouldLog('info')) {
        console.info(message as any, ...optionalParams as any[]);
      }
    },
    debug(message?: unknown, ...optionalParams: unknown[]): void {
      if (shouldLog('debug')) {
        console.debug(message as any, ...optionalParams as any[]);
      }
    },
  };


