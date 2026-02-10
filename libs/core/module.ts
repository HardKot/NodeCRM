import { Component, ComponentInjectType, ComponentType } from './component';
import { ComponentInstance, Container } from '../application/container';
import { MetadataRegistry } from './metadataRegistry';
import { SchemaRegistry } from '../schema';

interface ModuleHook {
  onModulePreBuild?: () => Promise<void>;
  onModulePostBuild?: () => Promise<void>;
}

export type Namespace = string | symbol;

class Module {
  constructor(
    public readonly name: string | symbol,
    public readonly components: Component<any, any>[] = [],
    private readonly hooks: ModuleHook = {},
    private readonly imports: Module[] = [],
    public readonly schemaRegistry: SchemaRegistry = new SchemaRegistry()
  ) {
    this.components.forEach(component => {
      component.module = this;
    });
    Object.freeze(this);
  }

  linkComponent(component: Component<any, any>) {
    if (this.components.includes(component)) return;
    this.components.push(component);
    component.module = this;
  }

  includeModule(module: Module): boolean {
    if (module === this) return true;
    if (this.imports.includes(module)) return true;
    return this.imports.some(it => it.includeModule(module));
  }
}

class RootModule extends Module {
  private constructor() {
    super(RootModule.name, []);
  }

  override includeModule() {
    return true;
  }

  clear() {
    this.components.length = 0;
  }

  static Instance = new RootModule();
}

export { Module, ModuleHook, RootModule };
