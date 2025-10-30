import MetadataKey from './metadataKey.js';
import * as MetadaRegistry from './metadataRegistry.js';

export function Component(key, dependency = []) {
  return function(target) {
    MetadaRegistry.defineMetadata(
      MetadataKey.Dependency,
      {
        key,
        dependency,
        postConstructor: new Set(),
      },
      target
    );
  };
}

export function PostConstructor() {
  return function(target, propertyKey) {
    MetadaRegistry.getMetadata(MetadataKey.Dependency, target)?.postConstructor.add(propertyKey);
  };
}

export function Schema(key) {
  return function(target) {
    MetadaRegistry.defineMetadata(MetadataKey.Schema, { key, types: {} }, target);
  };
}

export function Type(name, validate = {}) {
  return function(target, propertyKey) {
    const metadata = MetadaRegistry.getMetadata(MetadataKey.Schema, target);
    if (!metadata) return;

    metadata.types[propertyKey] = {
      name,
      validate,
    };
  };
}
