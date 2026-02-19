import { Metadata } from './metadata';
import { Module, RootModule } from './module';
import { Types } from '../utils';

import type { ComponentInjectType, ComponentTypeValue, EnumMap, ScopedValue } from './types';


const ComponentType: EnumMap<ComponentTypeValue> = Object.freeze({
  CONSUMER: 0,
  PROVIDER: 1,
});
const Scoped: EnumMap<ScopedValue> = Object.freeze({
  SINGLETON: 0,
  TRANSIENT: 1,
  SCOPED: 2,
});

class Component<T = unknown, D extends { [key: string | symbol]: any } = {}> {
  public readonly inject: ComponentInjectType[];
  public readonly type: number;
  public readonly scope: number;
  public readonly eager: boolean;
  public readonly binding: ComponentInjectType[];

  private readonly postConstructMethods: string | symbol;

  constructor(
    public readonly name: ComponentInjectType,
    public readonly factory: (deps: D) => T,
    public readonly metadata: Metadata,
    public module: Module = RootModule.Instance,
    reference?: any
  ) {
    this.inject = metadata.get<ComponentInjectType[]>('inject').orElse([]);
    this.type = metadata
      .get<number | string>('type')
      .map(it => {
        if (Types.isNumber(it)) return it;
        return ComponentType[it.toUpperCase() as ComponentTypeValue];
      })
      .orElse(ComponentType.PROVIDER);
    this.scope = metadata
      .get<number | string>('scope')
      .map(it => {
        if (Types.isNumber(it)) return it;
        return Scoped[it.toUpperCase() as ScopedValue];
      })
      .orElse(Scoped.SINGLETON);
    this.eager = metadata.get<boolean>('eager').orElse(false);
    const binding = metadata.get<ComponentInjectType[] | ComponentInjectType>('binding').orElse([]);
    if (Array.isArray(binding)) {
      this.binding = binding;
    } else {
      this.binding = [binding];
    }

    this.postConstructMethods = metadata
      .get<string | symbol>('postConstruct')
      .orElse('postConstruct');

    if (!this.binding.includes(this.name)) this.binding.push(this.name);
    if (reference && !this.binding.includes(reference)) this.binding.push(reference);

    module.linkComponent(this);
  }

  async runPostConstruct(instance: T) {
    const method = (instance as any)[this.postConstructMethods];
    if (method && typeof method === 'function') await method.apply(instance);
  }
}

export { Component, ComponentType, Scoped };
