import dotenv from 'dotenv';

export interface EnvConfig {
  apiKey?: string;
  baseUrl?: string;
  debug?: boolean;
}

/**
 *
 */
export function loadEnv(): void {
  dotenv.config();
}

/**
 *
 * @param name
 * @param defaultValue
 */
export function getEnv(name: string, defaultValue?: string): string | undefined {
  return process.env[name] || defaultValue;
}
