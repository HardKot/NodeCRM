import { Types } from '#lib/utils';

export function getMetadata(metadatKey, target, property) {
  if (!Types.isObject(target)) throw new TypeError();
  if (!Types.isUndefiend(property) && !Types.isSymbol(property) && !Types.isString(property))
    property = `${property}`;
}

export function defineMetadata(metadataKey, value, target, property) { }

export function hasMetadata(metadataKey, target, property) { }

export function deleteMetadata(metadataKey, target, property) { }
