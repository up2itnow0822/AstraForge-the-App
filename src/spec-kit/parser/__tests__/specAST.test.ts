import { describe, it, expect, beforeEach } from '@jest/globals';
import { SpecAST } from '../specAST';

describe('SpecAST', () => {
  let ast: SpecAST;

  beforeEach(() => {
    ast = new SpecAST();
  });

  it('should initialize with empty nodes', () => {
    expect(ast.getNodes()).toEqual([]);
  });

  it('should add nodes', () => {
    const node = { type: 'task', value: 'Do something' };
    ast.addNode(node);
    expect(ast.getNodes()).toHaveLength(1);
    expect(ast.getNodes()[0]).toBe(node);
  });
});
