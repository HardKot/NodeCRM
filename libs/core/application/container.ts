import { AsyncLocalStorage } from 'node:async_hooks';
import { Component, ComponentInjectType, Scoped, ComponentType } from '../component';

type ObjectInstance = Object & {
  postConstructor?: () => Promise<void>;
  dispose?: () => Promise<void>;
};

type ComponentInstance = ObjectInstance | Function;
type ComponentInstanceMap = WeakMap<Component<ComponentInstance>, ComponentInstance>;
type ComponentBindingsMap = Map<ComponentInjectType, Component<ComponentInstance>>;

class ContainerError extends Error {}

class Container {
  static async create(components: Component<any>[]) {
    const container = new Container(components);
    await container.build();

    return container;
  }

  private bindings: ComponentBindingsMap = new Map();
  private instances: ComponentInstanceMap = new WeakMap();
  private scope: AsyncLocalStorage<ComponentInstanceMap>;

  constructor(private components: Component<ComponentInstance>[] = []) {
    const entries = components
      .map(it =>
        it.binding.map<[ComponentInjectType, Component<ComponentInstance>]>(bind => [bind, it])
      )
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

  public async get(binding: ComponentInjectType) {
    const component = this.bindings.get(binding);

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

  public async type(type: ComponentType) {
    const instances = [];
    const components = new Set(this.bindings.values());
    for (const component of components.values()) {
      if (component.type !== type) continue;
      instances.push({
        name: component.name,
        instance: await this.get(component.name),
        metadata: component.metadata,
      });
    }
    return instances;
  }

  public async build() {
    if (this.detectedMissing()) return;
    if (this.detectedCircular()) return;
    await this.initEagerSingletons();
  }

  private async initSingletonComponent(component: Component<ComponentInstance>) {
    if (!this.instances.has(component)) {
      const instance = await this.initComponent(component);
      this.instances.set(component, instance);
    }
    return this.instances.get(component)!;
  }
  private async initScopedComponent(component: Component<ComponentInstance>) {
    const scopedInstances = this.scope.getStore()!;
    if (!scopedInstances?.has(component)) {
      const instance = await this.initComponent(component);
      scopedInstances.set(component, instance);
    }
    return scopedInstances.get(component)!;
  }
  private async initTransientComponent(component: Component<ComponentInstance>) {
    return await this.initComponent(component);
  }

  private async initComponent(component: Component<ComponentInstance>): Promise<ComponentInstance> {
    const dependency = Object.fromEntries(
      await Promise.all(component.inject.map(async it => [it, await this.get(it)]))
    );

    const instance = component.factory(dependency);
    await component.runPostConstruct(instance);

    return instance;
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
}

export { Container, ContainerError };
