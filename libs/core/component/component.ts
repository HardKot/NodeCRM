import { Metadata } from '../metadata';

type ComponentInjectType = string | symbol;

const ComponentType = Object.freeze({
  CONSUMER: 0,
  PROVIDER: 1,
});

type ComponentTypeValue = keyof typeof ComponentType;

const Scoped = Object.freeze({
  SINGLETON: 0,
  TRANSIENT: 1,
  SCOPED: 2,
});

type ScopedValue = keyof typeof Scoped;

class Component<T = unknown, D = Record<ComponentInjectType, unknown>> {
  public readonly inject: ComponentInjectType[];
  public readonly type: number;
  public readonly scope: number;
  public readonly eager: boolean;
  public readonly binding: ComponentInjectType[];

  private readonly postConstructMethods: string | symbol;

  constructor(
    public readonly name: ComponentInjectType,
    public readonly factory: (deps: D) => T,
    public readonly metadata: Metadata
  ) {
    this.inject = metadata.get<ComponentInjectType[]>('inject').orElse([]);
    this.type = metadata.get<number>('type').orElse(ComponentType.PROVIDER);
    this.scope = metadata.get<number>('scope').orElse(Scoped.SINGLETON);
    this.eager = metadata.get<boolean>('eager').orElse(false);
    this.binding = metadata.get<ComponentInjectType[]>('binding').orElse([this.name]);

    this.postConstructMethods = metadata
      .get<string | symbol>('postConstruct')
      .orElse('postConstruct');

    if (!this.binding.includes(this.name)) this.binding.push(this.name);
  }

  async runPostConstruct(instance: T) {
    const method = (instance as any)[this.postConstructMethods];
    if (method && typeof method === 'function') await method.apply(instance);
  }
}

export { Component, ComponentInjectType, ComponentType, Scoped, ComponentTypeValue, ScopedValue };
