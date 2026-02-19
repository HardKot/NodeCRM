import { AsyncLocalStorage } from 'node:async_hooks';
import { Component, ComponentInjectType, Scoped } from '../core';
import { Types } from '../utils';

type ObjectInstance = Object & {
  postConstructor?: () => Promise<void>;
  dispose?: () => Promise<void>;
};

type ComponentInstance = ObjectInstance | Function;
type ComponentInstanceMap = WeakMap<Component, any>;
type ComponentBindingsMap = Map<ComponentInjectType, Component>;

class ContainerError extends Error {}

const UnknownSymbol = Symbol();

class Container {
  static async create(components: any[]) {
    const container = new Container(components);
    await container.build();

    return container;
  }

  private bindings: ComponentBindingsMap = new Map();
  private instances: ComponentInstanceMap = new WeakMap();
  private scope: AsyncLocalStorage<ComponentInstanceMap>;

  constructor(public components: Component[] = []) {
    const entries = this.components
      .map(it => it.binding.map<[ComponentInjectType, Component]>(bind => [bind, it]))
      .flat(1);
    this.bindings = new Map(entries);
    this.scope = new AsyncLocalStorage<ComponentInstanceMap>({ defaultValue: this.instances });
  }

  public async runScope(callback: () => Promise<void>) {
    const instances = new Map();

    try {
      await this.scope.run(instances, callback);
    } finally {
      for (const instance of instances.values()) {
        instance.dispose?.();
      }
    }
  }

  public async get<T>(component: Component<T>): Promise<T | null>;
  public async get<T>(binding: ComponentInjectType): Promise<T | null>;
  public async get<T>(component: Component<T> | ComponentInjectType): Promise<T | null> {
    if (!(component instanceof Component)) {
      component = this.bindings.get(component) as Component<T>;
    }

    if (!component) return null;
    if (component.scope === Scoped.SINGLETON) {
      return await this.initSingletonComponent(component);
    }
    if (component.scope === Scoped.SCOPED) {
      return await this.initScopedComponent(component);
    }
    if (component.scope === Scoped.TRANSIENT) {
      return await this.initTransientComponent(component);
    }
    return await this.initComponent(component);
  }

  public async build() {
    if (this.detectedMissing()) return;
    if (this.detectedCircular()) return;
    await this.initEagerSingletons();
  }

  private async initSingletonComponent<T>(component: Component<T>) {
    if (!this.instances.has(component)) {
      const instance = await this.initComponent(component);
      this.instances.set(component, instance);
    }
    return this.instances.get(component)! as T;
  }
  private async initScopedComponent<T>(component: Component<T>) {
    const scopedInstances = this.scope.getStore()!;
    if (!scopedInstances?.has(component)) {
      const instance = await this.initComponent(component);
      scopedInstances.set(component, instance);
    }
    return scopedInstances.get(component)! as T;
  }
  private async initTransientComponent<T>(component: Component<T>) {
    return await this.initComponent(component);
  }

  private async initComponent<T>(component: Component<T>): Promise<T> {
    const dependency = await this.getDependency(component);

    const instance = component.factory.call(null, dependency);
    await component.runPostConstruct(instance);

    return instance;
  }

  private async getDependency(component: Component) {
    const dependency = new Array(component.inject.length);

    for (let i = 0; i < component.inject.length; i++) {
      const depKey = component.inject[i];
      const depComponent = this.bindings.get(depKey);

      const publicDepKey = this.getPublicInjectKey(depKey);

      const isExist = !!depComponent;
      // TODO: Придумать более изящный способ проверки, что зависимость входит в модуль компонента. Возможно, стоит добавить в компонент список публичных зависимостей, которые он может использовать.
      const isInModule = true // isExist && component.module.includeModule(depComponent.module);

      if (isExist && isInModule) {
        dependency[i] = [publicDepKey, await this.get(depComponent)];
      } else {
        dependency[i] = [publicDepKey, null];
      }
    }

    return Object.fromEntries(dependency);
  }

  private async initEagerSingletons() {
    for (const component of this.bindings.values()) {
      if (component.eager && component.scope === Scoped.SINGLETON) await this.get(component.name);
    }
  }
  private detectedMissing() {
    for (const component of this.bindings.values()) {
      for (const dep of component.inject) {
        if (!this.bindings.has(dep)) {
          throw new ContainerError(
            `Missing dependency: Component "${component.name.toString()}" depends on "${dep.toString()}", which is not registered in the container.`
          );
        }
      }
    }
    return false;
  }
  private detectedCircular() {
    const visited = new Set();
    const recStack = new Set();

    const hasCycle = (name: string | symbol, path: ComponentInjectType[] = []) => {
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

      const node = this.bindings.get(name);
      for (const dep of node?.inject ?? []) hasCycle(dep, [...path, name]);

      recStack.delete(name);
      return false;
    };

    for (const graphName of this.bindings.keys()) {
      hasCycle(graphName);
    }

    return false;
  }

  private getPublicInjectKey(key: any): string | symbol {
    if (Types.isString(key)) return key;
    if (Types.isSymbol(key)) return key;
    if (Types.isClass(key)) {
      const className = key.name ?? UnknownSymbol;
      return className.charAt(0).toLowerCase() + className.slice(1);
    }
    if (key.name) return key.name;
    return UnknownSymbol;
  }
}

export { Container, ContainerError, ComponentInstance };
