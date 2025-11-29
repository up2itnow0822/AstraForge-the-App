import fs from 'fs';

export class SecretManager {
  /**
   * Retrieves a secret/configuration value.
   * Priority:
   * 1. Docker Secret (FILE env var pointing to file)
   * 2. Environment Variable (Direct value)
   *
   * @param {string} key The base name of the configuration (e.g., 'ASTRA_SERVER_TOKEN')
   * @returns {string | undefined} The value of the secret, or undefined if not found.
   */
  static getSecret(key: string): string | undefined {
    // 1. Check for _FILE environment variable (Docker Secret pattern)
    const fileEnvVar = `${key}_FILE`;
    const filePath = process.env[fileEnvVar];

    console.log(`[SecretManager] getSecret("${key}"): checking FILE env var "${fileEnvVar}" = "${filePath || 'not set'}"`);

    if (filePath) {
      try {
        if (fs.existsSync(filePath)) {
          // Trim to remove newlines that might be added by editors or echo
          const value = fs.readFileSync(filePath, 'utf8').trim();
          console.log(`[SecretManager] getSecret("${key}"): READ FROM FILE, length=${value.length}`);
          return value;
        } else {
          console.log(`[SecretManager] getSecret("${key}"): file path "${filePath}" does not exist`);
        }
      } catch (error) {
        console.warn(`[SecretManager] Failed to read secret from file ${filePath} for ${key}:`, error);
      }
    }

    // 2. Fallback to direct environment variable
    const envValue = process.env[key];
    console.log(`[SecretManager] getSecret("${key}"): ENV fallback = "${envValue ? 'SET (length=' + envValue.length + ')' : 'NOT SET'}"`);
    return envValue;
  }
}

