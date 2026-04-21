import { SchemaRegistry } from '../schema';
import { Component } from './component';
import type { ModuleHook } from './types';
declare class Module {
    readonly name: string | symbol;
    protected readonly _components: Component<any, any>[];
    private readonly hooks;
    private readonly imports;
    readonly schemaRegistry: SchemaRegistry;
    constructor(name: string | symbol, _components?: Component<any, any>[], hooks?: ModuleHook, imports?: Module[], schemaRegistry?: SchemaRegistry);
    get components(): Component<any, any>[];
    linkComponent(component: Component<any, any>): void;
    linkModule(module: Module): void;
    includeModule(module: Module): boolean;
}
declare class RootModule extends Module {
    private constructor();
    includeModule(): boolean;
    clear(): void;
    static Instance: RootModule;
}
export { Module, ModuleHook, RootModule };
