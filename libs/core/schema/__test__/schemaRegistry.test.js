import { beforeEach, describe, it, expect, jest } from '@jest/globals';
import { SchemaRegistry } from '../schemaRegistry.js';

describe('SchemaRegistry', () => {
  let mockModule;
  let mockAdapter;
  let registry;

  beforeEach(() => {
    mockAdapter = {
      factoryType: jest.fn(name => ({ type: name })),
    };
    mockModule = {
      adapter: mockAdapter,
    };
    registry = new SchemaRegistry(mockModule);
  });

  it('should return registry instance for chaining', () => {
    const result = registry.set('test', { field: 'value' });
    expect(result).toBe(registry);
  });

  it('should set structure and return registry instance', () => {
    const structure = { field: 'value' };
    const result = registry.set('test', structure);
    expect(result).toBe(registry);
  });

  it('should allow chaining multiple updates', () => {
    registry.set('test1', { field1: 'value1' }).set('test2', { field2: 'value2' });
    expect(registry).toBeInstanceOf(SchemaRegistry);
  });

  it('should delete schema and structure', () => {
    registry.set('test', { field: 'value' });
    registry.get('test');

    const result = registry.delete('test');
    expect(result).toBe(registry);
  });

  it('should return registry instance for chaining', () => {
    const result = registry.delete('nonexistent');
    expect(result).toBe(registry);
  });
});
