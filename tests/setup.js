"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
// Clear all mocks before each test
beforeEach(() => {
    globals_1.jest.clearAllMocks();
});
// NOTE: Individual tests should handle their own mocking with jest.mock() in test files
