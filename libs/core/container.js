import { AsyncLocalStorage } from 'node:async_hooks';
import { Table, Types } from '#lib/utils';

import { ParserComponent, SUPPORT_SCOPES } from './parserComponent.js';

class ContainerError extends Error {}

class Container {
  static async create(components = [], { resolves = [], controllers = [] } = {}) {
    const container = new Container();
    for (const component of components) {
      container.add(component);
    }

    for (const resolve of resolves) {
      container.add(resolve, { type: 'resolve' });
    }
    for (const controller of controllers) {
      container.add(controller, { type: 'controller' });
    }

    await container.build();
    return container;
  }

  #parse = new ParserComponent();
  #scope = new AsyncLocalStorage();

  #components = new Map();
  #instances = new Map();
  #decorators = new Table();
  #interceptors = new Table();

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
    const component = this.#parse.parse(source);
    Object.assign(component, options);
    if (this.#components.has(component.name))
      throw new ContainerError('Component already registered: ' + component.name);
    this.#components.set(component.name, component);
  }

  update(source) {
    const component = this.#parse.parse(source);
    if (!this.#components.has(component.name))
      throw new ContainerError('Component not registered: ' + component.name);
    this.#components.set(component.name, component);

    if (this.#instances.has(component)) {
      const instance = this.#instances.get(component);
      instance.dispose?.();
      this.#instances.delete(component);
    }

    this.#components.set(component.name, component);

    for (const dependent of this.#components.values()) {
      if (dependent.dependencies.includes(component.name) && this.#instances.has(dependent)) {
        const dependentInstance = this.#instances.get(dependent);
        dependentInstance.dispose?.();
        this.#instances.delete(dependent);
      }
    }
  }

  async get(binding) {
    const component = this.#components.get(binding);
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

  async type(type) {
    const instances = [];
    for (const component of this.#components.values()) {
      if (component.type === type) instances.push(await this.get(component.name));
    }
    return instances;
  }

  async build() {
    if (this.#detectedMissing()) return;
    if (this.#detectedCircular()) return;

    for (const component of this.#components.values()) {
      if (component.eager && component.scope === SUPPORT_SCOPES.SINGLETON)
        await this.get(component.name);
    }
  }

  clear() {
    for (const instance of this.#instances.values()) {
      instance.dispose?.();
    }

    this.#components.clear();
    this.#instances.clear();
  }

  has(binding) {
    return this.#components.has(binding);
  }

  decorate(name, decorator) {
    const component = this.#components.get(name);
    this.#decorators.add(component, decorator);
  }

  intercept(name, interceptor) {
    const component = this.#components.get(name);
    this.#interceptors.add(component, interceptor);
  }

  async #createComponent(component) {
    if (!component) return null;

    const dependency = Object.fromEntries(
      await Promise.all(component.dependencies.map(async it => [it, await this.get(it)]))
    );
    let instance = component.factory(dependency);
    await instance.postConstructor?.();

    const decorators = this.#decorators.get(component);
    const interceptors = this.#interceptors.get(component);
    const clearInstance = instance;

    for (const decorator of decorators) {
      instance = decorator(instance, dependency);
    }

    if (interceptors.length > 0) {
      instance = new Proxy(instance, {
        get(target, key) {
          const original = target[key];
          if (!Types.isFunction(original)) return original;

          return async function () {
            for (const interceptor of interceptors) {
              await interceptor.before?.(clearInstance, key, arguments);
            }

            try {
              const result = original.apply(target, arguments);
              for (const interceptor of interceptors) {
                await interceptor.after?.(clearInstance, key, result);
              }
              return result;
            } catch (error) {
              for (const interceptor of interceptors) {
                await interceptor.error?.(clearInstance, key, error);
              }
              throw error;
            }
          };
        },
      });
    }

    return instance;
  }

  #detectedMissing() {
    for (const component of this.#components.values()) {
      for (const dep of component.dependencies) {
        if (!this.#components.has(dep)) {
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

      const node = this.#components.get(name);
      for (const dep of node.dependencies) hasCycle(dep, [...path, name]);

      recStack.delete(name);
      return false;
    };

    for (const graphName of this.#components.keys()) {
      hasCycle(graphName);
    }

    return false;
  }
}

export { Container, ContainerError };
