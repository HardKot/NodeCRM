import { Component, ComponentInjectType } from '../core';
type ObjectInstance = Object & {
    postConstructor?: () => Promise<void>;
    dispose?: () => Promise<void>;
};
type ComponentInstance = ObjectInstance | Function;
declare class ContainerError extends Error {
}
declare class Container {
    components: Component[];
    static create(components: any[]): unknown;
    private bindings;
    private instances;
    private scope;
    constructor(components?: Component[]);
    runScope(callback: () => Promise<void>): any;
    get<T>(component: Component<T>): Promise<T | null>;
    get<T>(binding: ComponentInjectType): Promise<T | null>;
    build(): any;
    private initSingletonComponent;
    private initScopedComponent;
    private initTransientComponent;
    private initComponent;
    private getDependency;
    private initEagerSingletons;
    private detectedMissing;
    private detectedCircular;
    private getPublicInjectKey;
}
export { Container, ContainerError, ComponentInstance };
