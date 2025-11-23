import { describe, it, expect, beforeEach } from '@jest/globals';
import { SpecParser } from '../specParser';

describe('SpecParser', () => {
  let parser: SpecParser;

  beforeEach(() => {
    parser = new SpecParser();
  });

  it('should parse spec string', () => {
    const result = parser.parse('some spec');
    expect(result).toEqual({ task: 'test', steps: [] });
  });

  it('should validate data', () => {
    const result = parser.validate({});
    expect(result).toEqual({ valid: true, errors: [] });
  });

  it('should generate AST', () => {
    const result = parser.generateAST('some spec');
    expect(result).toEqual({});
  });
});
