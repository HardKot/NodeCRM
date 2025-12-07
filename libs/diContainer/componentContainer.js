import { Component } from './component.js';

class ComponentContainerError extends Error {}

class ComponentContainer {
  constructor() {
    this.components = new Map();
    this.graph = null;
  }

  register(name, component) {
    if (!(component instanceof Component)) {
      throw new Error('Component must be an instance of Component class');
    }

    this.components.set(name, component);
    return this;
  }

  async build() {
    if (!this.graph) this.buildGraph();
    this.detectedCircularDependencies();

    const instances = [];

    for (const name of this.components.keys()) {
      const component = this.components.get(name);
      if (!component) {
        throw new Error(`Component with name "${name}" not found`);
      }

      instances.push([name, await component.getInstance(this)]);
    }

    return Object.freeze(Object.fromEntries(instances));
  }

  buildGraph() {
    const graph = {};

    for (const [name, component] of this.components.entries()) {
      graph[name] = {
        dependencies: component.dependencies ?? [],
        dependents: [],
      };
    }

    for (const [name, node] of Object.entries(graph)) {
      for (const dep of node.dependencies) {
        if (!graph[dep]) {
          throw new Error(`Component "${name}" has an unregistered dependency "${dep}"`);
        }
        graph[dep].dependents.push(name);
      }
    }

    this.graph = Object.freeze(graph);

    return this.graph;
  }

  detectedCircularDependencies() {
    const visited = new Set();
    const recStack = new Set();

    const hasCycle = (name, path = []) => {
      if (recStack.has(name)) {
        const cycle = [...path, name];
        const cycleStart = cycle.indexOf(name);
        throw new ComponentContainerError(
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

  async getInstance(name) {
    const component = this.components.get(name);
    if (!component) {
      throw new Error(`Component with name "${name}" not found`);
    }
    return component.getInstance(this);
  }
}

export { ComponentContainer, ComponentContainerError };
