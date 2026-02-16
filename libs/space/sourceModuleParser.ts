import { SourceParser } from '../utils';
import { Component, MetadataRegistry, Module, ModuleHook } from '../core';
import { SourceComponentParser, SourceComponentType } from './sourceComponentParser';

type LinkMetadata = (
  componentSource: SourceComponentType,
  metadataKey: string | symbol,
  metadataValue: any
) => void;

interface ModuleSource extends ModuleHook {
  imports?: ModuleSource[];
  providers?: SourceComponentType[];
  consumers?: SourceComponentType[];
  metadata?: (link: LinkMetadata) => void;
}

interface ModuleSourceObject extends ModuleSource {
  name?: string;
  factory?: () => any;
}

interface ModuleSourceFunction extends Function, ModuleSource {}

interface ModuleSourceClass extends ModuleSource {
  new (...args: any[]): any;
}

class SourceModuleParser extends SourceParser<Module> {
  private moduleStore: Map<ModuleSource, Module> = new Map();

  constructor(private componentParser: SourceComponentParser) {
    super();
  }

  override parseObject(source: ModuleSourceObject) {
    return this.modulePreprocess(source.name ?? Symbol(), source);
  }

  override parseFunction(source: ModuleSourceFunction) {
    return this.modulePreprocess(source.name, source);
  }
  override parseClass(source: ModuleSourceClass) {
    return this.modulePreprocess(source.name, source);
  }

  private extractMetadataCache = new WeakMap<ModuleSource, MetadataRegistry>();
  private extractMetadata(source: ModuleSource) {
    if (this.extractMetadataCache.has(source)) {
      return this.extractMetadataCache.get(source)!;
    }

    const metadataRegistry = new MetadataRegistry();

    source.metadata?.((component, metadataKey, metadataValue) => {
      metadataRegistry.registerTarget(component).set(metadataKey, metadataValue);
    });

    this.extractMetadataCache.set(source, metadataRegistry);
    return metadataRegistry;
  }

  private extractHooks(source: ModuleSource): ModuleHook {
    const hooks: ModuleHook = {};

    hooks.onModulePostBuild = source.onModulePostBuild?.bind?.(source);
    hooks.onModulePreBuild = source.onModulePreBuild?.bind?.(source);

    return hooks;
  }
  private extractImports(source: ModuleSource): Module[] {
    return source.imports?.map(it => this.parse(it)) ?? [];
  }

  private extractComponents(source: ModuleSource): Component[] {
    const sourceProviders = source.providers ?? [];
    const sourceConsumers = source.consumers ?? [];
    const components: Component[] = new Array(sourceProviders.length + sourceConsumers.length);

    for (let i = 0; i < sourceProviders.length; i++) {
      const metadata = this.extractMetadata(source).getMetadata(sourceProviders[i]);
      metadata?.set('type', 'provider');
      components[i] = this.componentParser.parse(sourceProviders[i], {
        metadata,
      });
    }
    for (let i = 0; i < sourceConsumers.length; i++) {
      const metadata = this.extractMetadata(source).getMetadata(sourceProviders[i]);
      metadata?.set('type', 'consumer');
      components[sourceProviders.length + i] = this.componentParser.parse(sourceConsumers[i], {
        metadata,
      });
    }

    return components;
  }

  private modulePreprocess(name: string | symbol, source: ModuleSource) {
    if (this.moduleStore.has(source)) {
      return this.moduleStore.get(source)!;
    }
    // const metadataRegistry = this.extractMetadata(source);
    const hooks = this.extractHooks(source);
    const imports = this.extractImports(source);
    const components = this.extractComponents(source);

    const module = new Module(name ?? Symbol(), components, hooks, imports);
    this.moduleStore.set(source, module);

    return module;
  }
}

export { SourceModuleParser, ModuleSource };
