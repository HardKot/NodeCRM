import { Component } from '../component';
import { MetadataRegistry } from '../metadata';

type ModuleHook = () => Promise<void>;

interface ModuleHooks {
  onModuleInit: ModuleHook[];
  onModuleDestroy: ModuleHook[];
  onApplicationBootstrap: ModuleHook[];
  onApplicationShutdown: ModuleHook[];
}

class Module {
  constructor(
    public readonly name: string | symbol,
    public readonly consumers: Component[],
    public readonly providers: Component[],
    public readonly metadataRegistry: MetadataRegistry,
    public readonly hooks: ModuleHooks
  ) {}

  async onModuleInit() {
    await Promise.all(this.hooks.onModuleInit?.map(it => it()));
  }
  async onModuleDestroy() {
    await Promise.all(this.hooks.onModuleDestroy?.map(it => it()));
  }
  async onApplicationBootstrap() {
    await Promise.all(this.hooks.onApplicationBootstrap?.map(it => it()));
  }
  async onApplicationShutdown() {
    await Promise.all(this.hooks.onApplicationShutdown?.map(it => it()));
  }

  static merge(taget: Module, source: Module) {
    const consumerSet = new Set(taget.consumers);
    const providerSet = new Set(taget.providers);

    source.consumers.forEach(consumer => consumerSet.add(consumer));
    source.providers.forEach(provider => providerSet.add(provider));

    return new Module(
      taget.name,
      consumerSet.values().toArray(),
      providerSet.values().toArray(),
      MetadataRegistry.merge(taget.metadataRegistry, source.metadataRegistry),
      {
        onModuleInit: [...taget.hooks.onModuleInit, ...source.hooks.onModuleInit],
        onModuleDestroy: [...taget.hooks.onModuleDestroy, ...source.hooks.onModuleDestroy],
        onApplicationBootstrap: [
          ...taget.hooks.onApplicationBootstrap,
          ...source.hooks.onApplicationBootstrap,
        ],
        onApplicationShutdown: [
          ...taget.hooks.onApplicationShutdown,
          ...source.hooks.onApplicationShutdown,
        ],
      }
    );
  }
}

export { Module, ModuleHooks };
