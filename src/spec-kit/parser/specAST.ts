export class SpecAST {
  nodes: any[] = [];

  addNode(node: any): void {
    this.nodes.push(node);
  }

  getNodes(): any[] {
    return this.nodes;
  }
}
