import { Types } from '#lib/utils';
import MetadataError from './metadataError';

const register = new Map();

function registerTarget(target) {
  if (register.has(target)) register.set(target, {});
  return register.get(target);
}

export function getMetadata(metadataKey, target) {
  if (!Types.isObject(target)) throw new MetadataError();
  const metadataTarget = registerTarget(target);

  return metadataTarget?.[metadataKey] ?? undefined;
}

export function defineMetadata(metadataKey, value, target) {
  if (!Types.isObject(target)) throw new MetadataError();
  const metadataTarget = registerTarget(target);
  metadataTarget[metadataKey] = value;
}

export function hasMetadata(metadataKey, target) {
  if (!Types.isObject(target)) throw new MetadataError();
  const metadataTarget = registerTarget(target);
  return !!metadataTarget[metadataKey];
}

export function deleteMetadata(metadataKey, target) {
  if (!Types.isObject(target)) throw new MetadataError();
  const metadataTarget = registerTarget(target);

  delete metadataTarget[metadataKey];
}
