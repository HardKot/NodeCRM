import { Types } from '#lib/utils';

class MetadataError extends Error {}

class MetadataRegistry {
  #register;

  constructor() {
    this.#register = new Map();
  }

  getMetadata(metadataKey, target) {
    if (!Types.isObject(target)) throw new MetadataError(`Target need is Object or function`);
    if (!Types.isPrimitive(metadataKey)) throw new MetadataError(`Metadata key is Primitive`);

    const metadataTarget = this.#registerTarget(target);

    return metadataTarget?.[metadataKey] ?? null;
  }

  defineMetadata(metadataKey, value, target) {
    if (!Types.isObject(target)) throw new MetadataError(`Target need is Object or function`);
    if (!Types.isPrimitive(metadataKey)) throw new MetadataError(`Metadata key is Primitive`);

    const metadataTarget = this.#registerTarget(target);
    metadataTarget[metadataKey] = value;
    return metadataTarget;
  }

  hasMetadata(metadataKey, target) {
    if (!Types.isObject(target)) throw new MetadataError(`Target need is Object or function`);
    if (!Types.isPrimitive(metadataKey)) throw new MetadataError(`Metadata key is Primitive`);

    const metadataTarget = this.#registerTarget(target);
    return !!metadataTarget[metadataKey];
  }

  deleteMetadata(metadataKey, target) {
    if (!Types.isObject(target)) throw new MetadataError(`Target need is Object or function`);
    if (!Types.isPrimitive(metadataKey)) throw new MetadataError(`Metadata key is Primitive`);

    const metadataTarget = this.#registerTarget(target);
    delete metadataTarget[metadataKey];
  }

  #registerTarget(target) {
    if (!this.#register.has(target)) this.#register.set(target, {});
    return this.#register.get(target);
  }
}

export { MetadataRegistry, MetadataError };
