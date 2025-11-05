import { describe, beforeEach, test, expect, jest } from '@jest/globals';
import { MetadataRegistry, MetadataError } from '../metadataRegistry.js';

describe('MetadataRegistry', () => {
  /** @type {MetadataRegistry} */
  let registry;
  class Target {}

  beforeEach(() => {
    registry = new MetadataRegistry();
  });

  test('Define metadata', () => {
    const TestSymbolKey = Symbol();
    const TestStrKey = 'Test';

    registry.defineMetadata(TestStrKey, { key: 'test', value: 1 }, Target);
    registry.defineMetadata(TestSymbolKey, { key: 'test', value: 2 }, Target);

    expect(registry.getMetadata(TestStrKey, Target)).toEqual({ key: 'test', value: 1 });
    expect(registry.getMetadata(TestSymbolKey, Target)).toEqual({ key: 'test', value: 2 });
  });

  test('Not support non primitive key', () => {
    const TestObjectKey = {};
    expect(() => registry.getMetadata(TestObjectKey, Target)).toThrow(MetadataError);
    expect(() => registry.defineMetadata(TestObjectKey, {}, Target)).toThrow(MetadataError);
    expect(() => registry.hasMetadata(TestObjectKey, Target)).toThrow(MetadataError);
    expect(() => registry.deleteMetadata(TestObjectKey, Target)).toThrow(MetadataError);
  });

  test('Save metadta link', () => {
    const MetadataObj = {};

    registry.defineMetadata('test', MetadataObj, Target);
    expect(registry.getMetadata('test', Target)).toBe(MetadataObj);
  });

  test('Delete metadata', () => {
    registry.defineMetadata('test', 10, Target);
    registry.deleteMetadata('test', Target);

    expect(registry.getMetadata('test', Target)).toBeNull();
  });

  test('Has metadata', () => {
    registry.defineMetadata('test', 10, Target);

    expect(registry.hasMetadata('test', Target)).toBeTruthy();
    expect(registry.hasMetadata('test2', Target)).toBeFalsy();
  });
});
