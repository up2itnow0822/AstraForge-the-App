export interface Migration {
  version: string;
  name: string;
  execute: () => Promise<boolean>;
  rollback: () => Promise<boolean>;
}

export interface MigrationState {
  currentVersion: string;
  appliedMigrations: string[];
  lastApplied: number;
}

export class MigrationManager {
  private migrations: Map<string, Migration> = new Map();
  private state: MigrationState = {
    currentVersion: '0.0.0',
    appliedMigrations: [],
    lastApplied: 0
  };

  /**
   *
   * @param dbPath
   */
  constructor(private dbPath: string = './migrations') {}

  /**
   *
   * @param migration
   */
  registerMigration(migration: Migration): void {
    this.migrations.set(migration.version, migration);
  }

  /**
   *
   * @param targetVersion
   */
  async migrate(targetVersion?: string): Promise<{ success: boolean; applied: string[]; errors: string[] }> {
    const target = targetVersion || this.getLatestVersion();
    const toApply = this.getMigrationsToApply(target);

    const result = {
      success: true,
      applied: [] as string[],
      errors: [] as string[]
    };

    for (const migration of toApply) {
      try {
        const success = await migration.execute();
        if (success) {
          this.markApplied(migration.version);
          result.applied.push(migration.version);
        }
      } catch (error: any) {
        result.success = false;
        result.errors.push(`Migration ${migration.version} failed: ${error.message}`);
        break;
      }
    }

    return result;
  }

  /**
   *
   */
  private getLatestVersion(): string {
    const versions = Array.from(this.migrations.keys());
    if (versions.length === 0) return '0.0.0';
    return versions.sort().pop() || '0.0.0';
  }

  /**
   *
   * @param target
   */
  private getMigrationsToApply(target: string): Migration[] {
    const applied = new Set(this.state.appliedMigrations);
    const available = Array.from(this.migrations.values())
      .filter(m => !applied.has(m.version))
      .filter(m => this.versionCompare(m.version, target) <= 0)
      .sort((a, b) => this.versionCompare(a.version, b.version));

    return available;
  }

  /**
   *
   * @param a
   * @param b
   */
  private versionCompare(a: string, b: string): number {
    const aParts = a.split('.').map(Number);
    const bParts = b.split('.').map(Number);

    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aPart = aParts[i] || 0;
      const bPart = bParts[i] || 0;

      if (aPart > bPart) return 1;
      if (aPart < bPart) return -1;
    }

    return 0;
  }

  /**
   *
   * @param version
   */
  private markApplied(version: string): void {
    this.state.appliedMigrations.push(version);
    this.state.currentVersion = version;
    this.state.lastApplied = Date.now();
  }

  /**
   *
   * @param targetVersion
   */
  async rollback(targetVersion: string): Promise<{ success: boolean; rolledBack: string[]; errors: string[] }> {
    const toRollback = this.getMigrationsToRollback(targetVersion);

    const result = {
      success: true,
      rolledBack: [] as string[],
      errors: [] as string[]
    };

    for (const migration of toRollback) {
      try {
        const success = await migration.rollback();
        if (success) {
          this.markRolledBack(migration.version);
          result.rolledBack.push(migration.version);
        }
      } catch (error: any) {
        result.success = false;
        result.errors.push(`Rollback ${migration.version} failed: ${error.message}`);
        break;
      }
    }

    return result;
  }

  /**
   *
   * @param target
   */
  private getMigrationsToRollback(target: string): Migration[] {
    const applied = [...this.state.appliedMigrations].reverse();
    const toRollback: Migration[] = [];

    for (const version of applied) {
      if (this.versionCompare(version, target) > 0) {
        const migration = this.migrations.get(version);
        if (migration) toRollback.push(migration);
      } else {
        break;
      }
    }

    return toRollback;
  }

  /**
   *
   * @param version
   */
  private markRolledBack(version: string): void {
    const index = this.state.appliedMigrations.indexOf(version);
    if (index > -1) {
      this.state.appliedMigrations.splice(index, 1);
    }

    const sorted = [...this.state.appliedMigrations].sort((a, b) => this.versionCompare(a, b));
    this.state.currentVersion = sorted.pop() || '0.0.0';
  }
}
