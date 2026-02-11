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
    protected readonly _components: Component<any, any>[] = [],
    private readonly hooks: ModuleHook = {},
    private readonly imports: Module[] = [],
    public readonly schemaRegistry: SchemaRegistry = new SchemaRegistry()
  ) {
    Object.freeze(this);
  }

  get components(): Component<any, any>[] {
    return this._components.concat(this.imports.map(it => it.components).flat());
  }

  linkComponent(component: Component<any, any>) {
    if (this._components.includes(component)) return;
    this._components.push(component);
    component.module = this;
  }

  linkModule(module: Module) {
    if (module === this) return;
    if (this.imports.includes(module)) return;
    this.imports.push(module);
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
    this._components.length = 0;
  }

  static Instance = new RootModule();
}

export { Module, ModuleHook, RootModule };
