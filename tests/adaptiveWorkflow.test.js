"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const adaptiveWorkflow_js_1 = require("../src/rl/adaptiveWorkflow.js");
const logger_js_1 = require("../src/utils/logger.js");
globals_1.jest.mock('../src/utils/logger.js');
(0, globals_1.describe)('AdaptiveWorkflow', () => {
    let workflow;
    let mockLogger;
    (0, globals_1.beforeEach)(() => {
        globals_1.jest.clearAllMocks();
        workflow = new adaptiveWorkflow_js_1.AdaptiveWorkflow();
        mockLogger = new logger_js_1.Logger();
    });
    (0, globals_1.describe)('adapt', () => {
        (0, globals_1.it)('should execute adaptation without errors', async () => {
            await (0, globals_1.expect)(workflow.adapt()).resolves.not.toThrow();
        });
        (0, globals_1.it)('should complete successfully and return void', async () => {
            const result = await workflow.adapt();
            (0, globals_1.expect)(result).toBeUndefined();
        });
        (0, globals_1.it)('should call logger.info during adaptation', async () => {
            const loggerSpy = globals_1.jest.spyOn(logger_js_1.Logger.prototype, 'info');
            await workflow.adapt();
            (0, globals_1.expect)(loggerSpy).toHaveBeenCalled();
        });
    });
});
