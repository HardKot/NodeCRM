import { RootModule } from './module';
import { Types } from '../utils';
const ComponentType = Object.freeze({
    CONSUMER: 0,
    PROVIDER: 1,
});
const Scoped = Object.freeze({
    SINGLETON: 0,
    TRANSIENT: 1,
    SCOPED: 2,
});
class Component {
    name;
    factory;
    metadata;
    module;
    inject;
    type;
    scope;
    eager;
    binding;
    postConstructMethods;
    constructor(name, factory, metadata = {}, module = RootModule.Instance, reference) {
        this.name = name;
        this.factory = factory;
        this.metadata = metadata;
        this.module = module;
        const inject = this.resolveValue(metadata, 'inject', []);
        this.inject = Array.isArray(inject) ? inject : [inject].filter(Boolean);
        this.type = this.resolveEnumValue(metadata, 'type', ComponentType, ComponentType.PROVIDER);
        this.scope = this.resolveEnumValue(metadata, 'scope', Scoped, Scoped.SINGLETON);
        this.eager = this.resolveValue(metadata, 'eager', false);
        const binding = this.resolveValue(metadata, 'binding', []);
        if (Array.isArray(binding)) {
            this.binding = [...binding];
        }
        else {
            this.binding = binding ? [binding] : [];
        }
        this.postConstructMethods = this.resolveValue(metadata, 'postConstruct', 'postConstruct');
        if (!this.binding.includes(this.name))
            this.binding.push(this.name);
        if (reference && !this.binding.includes(reference))
            this.binding.push(reference);
        module.linkComponent(this);
    }
    resolveValue(metadata, key, defaultValue) {
        if (!metadata)
            return defaultValue;
        const value = metadata[key];
        return typeof value === 'undefined' ? defaultValue : value;
    }
    resolveEnumValue(metadata, key, enumMap, defaultValue) {
        const value = this.resolveValue(metadata, key, defaultValue);
        if (Types.isNumber(value))
            return value;
        if (Types.isString(value)) {
            return enumMap[value.toUpperCase()] ?? defaultValue;
        }
        return defaultValue;
    }
    async runPostConstruct(instance) {
        const method = instance[this.postConstructMethods];
        if (method && typeof method === 'function')
            await method.apply(instance);
    }
}
export { Component, ComponentType, Scoped };
