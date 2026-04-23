const { AsyncLocalStorage } = require('node:async_hooks');
const { Component, Scoped } = require('../core');
const { Types } = require('../utils');
class ContainerError extends Error {
}
const UnknownSymbol = Symbol();
class Container {
    components;
    static async create(components) {
        const container = new Container(components);
        await container.build();
        return container;
    }
    bindings = new Map();
    instances = new WeakMap();
    scope;
    constructor(components = []) {
        this.components = components;
        const entries = this.components
            .map(it => it.binding.map(bind => [bind, it]))
            .flat(1);
        this.bindings = new Map(entries);
        this.scope = new AsyncLocalStorage({ defaultValue: this.instances });
    }
    async runScope(callback) {
        const instances = new Map();
        try {
            await this.scope.run(instances, callback);
        }
        finally {
            for (const instance of instances.values()) {
                instance.dispose?.();
            }
        }
    }
    async get(component) {
        if (!(component instanceof Component)) {
            component = this.bindings.get(component);
        }
        if (!component)
            return null;
        if (component.scope === Scoped.SINGLETON) {
            return await this.initSingletonComponent(component);
        }
        if (component.scope === Scoped.SCOPED) {
            return await this.initScopedComponent(component);
        }
        if (component.scope === Scoped.TRANSIENT) {
            return await this.initTransientComponent(component);
        }
        return await this.initComponent(component);
    }
    async build() {
        if (this.detectedMissing())
            return;
        if (this.detectedCircular())
            return;
        await this.initEagerSingletons();
    }
    async initSingletonComponent(component) {
        if (!this.instances.has(component)) {
            const instance = await this.initComponent(component);
            this.instances.set(component, instance);
        }
        return this.instances.get(component);
    }
    async initScopedComponent(component) {
        const scopedInstances = this.scope.getStore();
        if (!scopedInstances?.has(component)) {
            const instance = await this.initComponent(component);
            scopedInstances.set(component, instance);
        }
        return scopedInstances.get(component);
    }
    async initTransientComponent(component) {
        return await this.initComponent(component);
    }
    async initComponent(component) {
        const dependency = await this.getDependency(component);
        const instance = component.factory.call(null, dependency);
        await component.runPostConstruct(instance);
        return instance;
    }
    async getDependency(component) {
        const dependency = new Array(component.inject.length);
        for (let i = 0; i < component.inject.length; i++) {
            const depKey = component.inject[i];
            const depComponent = this.bindings.get(depKey);
            const publicDepKey = this.getPublicInjectKey(depKey);
            const isExist = !!depComponent;
            const isInModule = isExist && component.module.includeModule(depComponent.module);
            if (isExist && isInModule) {
                dependency[i] = [publicDepKey, await this.get(depComponent)];
            }
            else {
                dependency[i] = [publicDepKey, null];
            }
        }
        return Object.fromEntries(dependency);
    }
    async initEagerSingletons() {
        for (const component of this.bindings.values()) {
            if (component.eager && component.scope === Scoped.SINGLETON)
                await this.get(component.name);
        }
    }
    detectedMissing() {
        for (const component of this.bindings.values()) {
            for (const dep of component.inject) {
                if (!this.bindings.has(dep)) {
                    throw new ContainerError(`Missing dependency: Component "${component.name.toString()}" depends on "${dep.toString()}", which is not registered in the container.`);
                }
            }
        }
        return false;
    }
    detectedCircular() {
        const visited = new Set();
        const recStack = new Set();
        const hasCycle = (name, path = []) => {
            if (recStack.has(name)) {
                const cycle = [...path, name];
                const cycleStart = cycle.indexOf(name);
                throw new ContainerError(`Circular dependency detected: ${cycle.slice(cycleStart).join(' -> ')}`);
            }
            if (visited.has(name))
                return false;
            visited.add(name);
            recStack.add(name);
            const node = this.bindings.get(name);
            for (const dep of node?.inject ?? [])
                hasCycle(dep, [...path, name]);
            recStack.delete(name);
            return false;
        };
        for (const graphName of this.bindings.keys()) {
            hasCycle(graphName);
        }
        return false;
    }
    getPublicInjectKey(key) {
        if (Types.isString(key))
            return key;
        if (Types.isSymbol(key))
            return key;
        if (Types.isClass(key)) {
            const className = key.name ?? UnknownSymbol;
            return className.charAt(0).toLowerCase() + className.slice(1);
        }
        if (key.name)
            return key.name;
        return UnknownSymbol;
    }
}

exports.Container = Container;
exports.ContainerError = ContainerError;