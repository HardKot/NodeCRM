import { AsyncLocalStorage } from 'node:async_hooks';
import { Table } from '../utils/index.js';
import { Component, SUPPORT_SCOPES } from './component.js';

class ContainerError extends Error {}

class Container {
  static async create(components = []) {
    const container = new Container(components.map(it => Component.parse(it)));
    await container.build();

    return container;
  }

  #scope = new AsyncLocalStorage();

  #bindings = new Map();
  #instances = new Map();
  #decorators = new Table();

  constructor(components = []) {
    const entries = components.map(it => it.binding.map(bind => [bind, it])).flat();
    this.#bindings = new Map(entries);
  }

  async runScope(callback) {
    const instances = new Map();

    try {
      await this.#scope.run(instances, callback);
    } finally {
      for (const instance of instances.values()) {
        instance.dispose?.();
      }
    }
  }

  add(source, options = {}) {
    const component = Component.parse(source);
    Object.assign(component, options);
    if (this.#bindings.has(component.name))
      throw new ContainerError('Component already registered: ' + component.name);
    this.#bindings.set(component.name, component);
  }

  async get(binding) {
    const component = this.#bindings.get(binding);
    if (!component) return null;

    if (component.scope === SUPPORT_SCOPES.SINGLETON) {
      if (!this.#instances.has(component)) {
        const instance = await this.#createComponent(component);
        this.#instances.set(component, instance);
      }
      return this.#instances.get(component);
    }

    if (component.scope === SUPPORT_SCOPES.SCOPED) {
      const scopedInstances = this.#scope.getStore();

      if (!scopedInstances) {
        throw new ContainerError(
          `No scope available for scoped component: ${component.name}. Ensure that 'runScope' is used.`
        );
      }

      if (!scopedInstances.has(component)) {
        const instance = await this.#createComponent(component);
        scopedInstances.set(component, instance);
      }
      return scopedInstances.get(component);
    }

    return await this.#createComponent(component);
  }

  getComponents() {
    return new Set(this.#bindings.values()).values().toArray();
  }

  async type(type) {
    const instances = [];
    const components = new Set(this.#bindings.values());
    for (const component of components.values()) {
      if (component.type !== type) continue;
      instances.push({
        name: component.name,
        instance: await this.get(component.name),
        meta: component.meta,
      });
    }
    return instances;
  }

  async build() {
    if (this.#detectedMissing()) return;
    if (this.#detectedCircular()) return;

    for (const component of this.#bindings.values()) {
      if (component.eager && component.scope === SUPPORT_SCOPES.SINGLETON)
        await this.get(component.name);
    }
  }

  decorate(name, decorator) {
    const component = this.#bindings.get(name);
    this.#decorators.add(component, decorator);
  }

  async #createComponent(component) {
    if (!component) return null;

    const dependency = Object.fromEntries(
      await Promise.all(component.inject.map(async it => [it, await this.get(it)]))
    );
    let instance = component.factory(dependency);
    await instance.postConstructor?.();

    const decorators = this.#decorators.get(component);

    for (const decorator of decorators) {
      instance = decorator(instance, dependency);
    }

    return instance;
  }

  #detectedMissing() {
    for (const component of this.#bindings.values()) {
      for (const dep of component.inject) {
        if (!this.#bindings.has(dep)) {
          throw new ContainerError(
            `Missing dependency: Component "${component.name}" depends on "${dep}", which is not registered in the container.`
          );
        }
      }
    }
    return false;
  }

  #detectedCircular() {
    const visited = new Set();
    const recStack = new Set();

    const hasCycle = (name, path = []) => {
      if (recStack.has(name)) {
        const cycle = [...path, name];
        const cycleStart = cycle.indexOf(name);
        throw new ContainerError(
          `Circular dependency detected: ${cycle.slice(cycleStart).join(' -> ')}`
        );
      }

      if (visited.has(name)) return false;

      visited.add(name);
      recStack.add(name);

      const node = this.#bindings.get(name);
      for (const dep of node.inject) hasCycle(dep, [...path, name]);

      recStack.delete(name);
      return false;
    };

    for (const graphName of this.#bindings.keys()) {
      hasCycle(graphName);
    }

    return false;
  }
}

export { Container, ContainerError };
