import { SourceParser, SourceParserError, Types } from '../../utils';
import { Module, ModuleHooks } from './module';
import { Component, SourceComponentParser, SourceComponentType } from '../component';
import { MetadataRegistry } from '../metadata';

type LinkMetadata = (
  componentSource: SourceComponentType,
  metadataKey: string | symbol,
  metadataValue: any
) => void;

interface ModuleSource {
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
  constructor(private componentParser: SourceComponentParser) {
    super();
  }

  override parseObject(source: ModuleSourceObject) {
    return this.modulePreprocess(source.name ?? Symbol(), source, source.factory);
  }

  override parseFunction(source: ModuleSourceFunction) {
    return this.modulePreprocess(source.name, source, () => source());
  }
  override parseClass(source: ModuleSourceClass) {
    return this.modulePreprocess(source.name, source, () => new source());
  }

  private extractMetadata(source: ModuleSource) {
    const metadataRegistry = new MetadataRegistry();

    source.metadata?.((component, metadataKey, metadataValue) => {
      metadataRegistry.registerTarget(component).set(metadataKey, metadataValue);
    });

    return metadataRegistry;
  }
  private extractHooks(factory?: () => any): ModuleHooks {
    const instance = factory?.() ?? {};

    const hooks: ModuleHooks = {
      onModuleDestroy: [],
      onModuleInit: [],
      onApplicationBootstrap: [],
      onApplicationShutdown: [],
    };
    if (!Types.isObject(instance)) return hooks;

    for (const hookName in hooks) {
      const method = instance[hookName];
      if (!Types.isFunction(method))
        throw new SourceParserError(`Hook ${hookName} is not a function`);
      hooks[hookName as keyof ModuleHooks].push(method.bind(instance));
    }

    return hooks;
  }
  private extractImports(source: ModuleSource): Module[] {
    return source.imports?.map(it => this.parse(it)) ?? [];
  }

  private modulePreprocess(name: string | symbol, source: ModuleSource, factory?: () => any) {
    const metadataRegistry = this.extractMetadata(source);
    const hooks = this.extractHooks(factory);
    const imports = this.extractImports(source);
    const providers =
      source.providers?.map(it => {
        return this.componentParser.parse(it, { metadata: metadataRegistry.getMetadata(it) });
      }) ?? [];
    const consumers =
      source.consumers?.map(it => {
        return this.componentParser.parse(it, { metadata: metadataRegistry.getMetadata(it) });
      }) ?? [];

    const originalModule = new Module(
      name || Symbol(),
      consumers,
      providers,
      metadataRegistry,
      hooks
    );

    return imports.reduce((moduleAcc, importedModule) => {
      return Module.merge(moduleAcc, importedModule);
    }, originalModule);
  }
}

export { SourceModuleParser };
