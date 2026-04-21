import { SourceParser } from '../utils';
import { MetadataRegistry, Module } from '../core';
class SourceModuleParser extends SourceParser {
    componentParser;
    moduleStore = new Map();
    constructor(componentParser) {
        super();
        this.componentParser = componentParser;
    }
    parseObject(source) {
        return this.modulePreprocess(source.name ?? Symbol(), source);
    }
    parseFunction(source) {
        return this.modulePreprocess(source.name, source);
    }
    parseClass(source) {
        return this.modulePreprocess(source.name, source);
    }
    extractMetadataCache = new WeakMap();
    extractMetadata(source) {
        if (this.extractMetadataCache.has(source)) {
            return this.extractMetadataCache.get(source);
        }
        const metadataRegistry = new MetadataRegistry();
        source.metadata?.((component, metadataKey, metadataValue) => {
            metadataRegistry.registerTarget(component).set(metadataKey, metadataValue);
        });
        this.extractMetadataCache.set(source, metadataRegistry);
        return metadataRegistry;
    }
    extractHooks(source) {
        const hooks = {};
        hooks.onModulePostBuild = source.onModulePostBuild?.bind?.(source);
        hooks.onModulePreBuild = source.onModulePreBuild?.bind?.(source);
        return hooks;
    }
    extractImports(source) {
        return source.imports?.map(it => this.parse(it)) ?? [];
    }
    extractComponents(source) {
        const sourceProviders = source.providers ?? [];
        const sourceConsumers = source.consumers ?? [];
        const components = new Array(sourceProviders.length + sourceConsumers.length);
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
    modulePreprocess(name, source) {
        if (this.moduleStore.has(source)) {
            return this.moduleStore.get(source);
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
export { SourceModuleParser };
