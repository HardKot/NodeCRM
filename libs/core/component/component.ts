import { ComponentType } from './componentType';
import { Scoped } from './scoped';
import { Metadata } from '../metadata';

type ComponentInjectType = string | symbol;

class Component<T = unknown, D = Record<ComponentInjectType, unknown>> {
  public readonly inject: ComponentInjectType[];
  public readonly type: ComponentType;
  public readonly scope: Scoped;
  public readonly eager: boolean;
  public readonly binding: ComponentInjectType[];

  private readonly postConstructMethods: string | symbol;

  constructor(
    public readonly name: ComponentInjectType,
    public readonly factory: (deps: D) => T,
    public readonly metadata: Metadata
  ) {
    this.inject = metadata.get<ComponentInjectType[]>('inject').orElse([]);
    this.type = metadata.get<ComponentType>('type').orElse(ComponentType.PROVIDER);
    this.scope = metadata.get<Scoped>('scope').orElse(Scoped.SINGLETON);
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

export { Component, ComponentInjectType };
