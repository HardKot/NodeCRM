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
    constructor(name, factory, metadata, module = RootModule.Instance, reference) {
        this.name = name;
        this.factory = factory;
        this.metadata = metadata;
        this.module = module;
        this.inject = metadata.get('inject').orElse([]);
        this.type = metadata
            .get('type')
            .map(it => {
            if (Types.isNumber(it))
                return it;
            return ComponentType[it.toUpperCase()];
        })
            .orElse(ComponentType.PROVIDER);
        this.scope = metadata
            .get('scope')
            .map(it => {
            if (Types.isNumber(it))
                return it;
            return Scoped[it.toUpperCase()];
        })
            .orElse(Scoped.SINGLETON);
        this.eager = metadata.get('eager').orElse(false);
        const binding = metadata.get('binding').orElse([]);
        if (Array.isArray(binding)) {
            this.binding = binding;
        }
        else {
            this.binding = [binding];
        }
        this.postConstructMethods = metadata
            .get('postConstruct')
            .orElse('postConstruct');
        if (!this.binding.includes(this.name))
            this.binding.push(this.name);
        if (reference && !this.binding.includes(reference))
            this.binding.push(reference);
        module.linkComponent(this);
    }
    async runPostConstruct(instance) {
        const method = instance[this.postConstructMethods];
        if (method && typeof method === 'function')
            await method.apply(instance);
    }
}
export { Component, ComponentType, Scoped };
