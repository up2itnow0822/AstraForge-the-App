export class EnvLoader {
  static get(key: string, defaultValue = ''): string {
    return process.env[key] || defaultValue;
  }
}

export const envLoader = EnvLoader;
