import { Metadata } from './metadata';
class MetadataRegistry {
    registry = new WeakMap();
    registerTarget(target) {
        if (!this.registry.has(target)) {
            this.registry.set(target, new Metadata());
        }
        return this.registry.get(target);
    }
    getMetadata(target) {
        return this.registry.get(target);
    }
}
export { MetadataRegistry };
