class GraphError extends Error { }

class Graph {
  constructor() {
    this.graph = new Map();
    this.components = new Set();
  }

  build() {
    for (const component of this.components) {
      let node = this.graph.get(component.name);
      if (!node) {
        node = {
          dependencies: component.dependencies,
          dependents: [],
        };
      }

      this.graph.set(component.name, node);
    }

    for (const [name, node] of this.graph.entries()) {
      for (const dep of node.dependencies) {
        if (!this.graph.get(dep)) {
          throw new GraphError(`Component "${name}" has an unregistered dependency "${dep}"`);
        }
        this.graph.get(dep).dependents.push(name);
      }
    }
  }

  detectedCircular() {
    const visited = new Set();
    const recStack = new Set();

    const hasCycle = (name, path = []) => {
      if (recStack.has(name)) {
        const cycle = [...path, name];
        const cycleStart = cycle.indexOf(name);
        throw new GraphError(
          `Circular dependency detected: ${cycle.slice(cycleStart).join(' -> ')}`
        );
      }

      if (visited.has(name)) return false;

      visited.add(name);
      recStack.add(name);

      const node = this.graph[name];
      for (const dep of node.dependencies ?? []) hasCycle(dep, [...path, name]);

      recStack.delete(name);
      return false;
    };

    for (const graphName in this.graph) {
      hasCycle(graphName);
    }
  }
}

export { Graph, GraphError };
