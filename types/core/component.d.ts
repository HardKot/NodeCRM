import { Module } from './module';
import type { ComponentInjectType, ComponentTypeValue, EnumMap, ScopedValue } from './types';
declare const ComponentType: EnumMap<ComponentTypeValue>;
declare const Scoped: EnumMap<ScopedValue>;
declare class Component<T = unknown, D extends {
    [key: string | symbol]: any;
} = {}> {
    readonly name: ComponentInjectType;
    readonly factory: (deps: D) => T;
    readonly metadata: any;
    module: Module;
    readonly inject: ComponentInjectType[];
    readonly type: number;
    readonly scope: number;
    readonly eager: boolean;
    readonly binding: ComponentInjectType[];
    private readonly postConstructMethods;
    constructor(name: ComponentInjectType, factory: (deps: D) => T, metadata: any, module?: Module, reference?: any);
    runPostConstruct(instance: T): any;
}
export { Component, ComponentType, Scoped };
