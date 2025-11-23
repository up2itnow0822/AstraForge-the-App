import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { AdaptiveWorkflow } from '../src/rl/adaptiveWorkflow.js';
import { Logger } from '../src/utils/logger.js';

jest.mock('../src/utils/logger.js');

describe('AdaptiveWorkflow', () => {
  let workflow: AdaptiveWorkflow;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    jest.clearAllMocks();
    workflow = new AdaptiveWorkflow();
    mockLogger = new Logger() as jest.Mocked<Logger>;
  });

  describe('adapt', () => {
    it('should execute adaptation without errors', async () => {
      await expect(workflow.adapt()).resolves.not.toThrow();
    });

    it('should complete successfully and return void', async () => {
      const result = await workflow.adapt();
      expect(result).toBeUndefined();
    });

    it('should call logger.info during adaptation', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'info');
      await workflow.adapt();
      expect(loggerSpy).toHaveBeenCalled();
    });
  });
});
