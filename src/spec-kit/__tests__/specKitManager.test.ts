import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { SpecKitManager } from '../specKitManager';

describe('SpecKitManager', () => {
  let manager: SpecKitManager;

  beforeEach(() => {
    // Instantiate without arguments as per implementation
    manager = new SpecKitManager();
  });

  it('should be instantiated', () => {
    expect(manager).toBeDefined();
  });
});
