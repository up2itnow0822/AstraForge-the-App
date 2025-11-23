export class SpecParser {
  parse(spec: string): any {
    return { task: 'test', steps: [] };
  }

  validate(data: any): { valid: boolean; errors: string[] } {
    return { valid: true, errors: [] };
  }

  generateAST(spec: string): any {
    return {};
  }
}
