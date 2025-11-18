import { beforeEach, describe, it, expect, jest } from '@jest/globals';
import { DefaultAdapter } from '../defaultAdapter';
import { Types } from '../types.js';
import { ScalarField, EnumField, ArrayField, SchemaField, UnknownField } from '../field.js';

describe('DefaultAdapter', () => {
  let adapter;
  let mockRegistry;

  beforeEach(() => {
    mockRegistry = {
      get: jest.fn(),
    };
    adapter = new DefaultAdapter({ registry: mockRegistry });
  });

  describe('factoryType', () => {
    it('should create ScalarField for NUMBER type', () => {
      const result = adapter.factoryType({ Type: Types.NUMBER, required: true });
      expect(result).toBeInstanceOf(ScalarField);
      expect(result.scalar).toBe('number');
      expect(result.required).toBe(true);
    });

    it('should create ScalarField for STRING type', () => {
      const result = adapter.factoryType({ Type: Types.STRING, required: false });
      expect(result).toBeInstanceOf(ScalarField);
      expect(result.scalar).toBe('string');
      expect(result.required).toBe(false);
    });

    it('should create ScalarField for BOOLEAN type', () => {
      const result = adapter.factoryType({ Type: Types.BOOLEAN, required: true });
      expect(result).toBeInstanceOf(ScalarField);
      expect(result.scalar).toBe('boolean');
    });

    it('should create EnumField for ENUM type', () => {
      const enumValues = ['option1', 'option2', 'option3'];
      const result = adapter.factoryType({
        Type: Types.ENUM,
        required: true,
        options: { enum: enumValues },
      });
      expect(result).toBeInstanceOf(EnumField);
      expect(result.values).toEqual(enumValues);
    });

    it('should create ArrayField for ARRAY type', () => {
      const result = adapter.factoryType({
        Type: Types.ARRAY,
        options: { value: { Type: Types.STRING, required: false } },
      });
      expect(result).toBeInstanceOf(ArrayField);
    });

    it('should create SchemaField for SCHEMA type', () => {
      const result = adapter.factoryType({
        Type: Types.SCHEMA,
        options: { schema: { Type: Types.STRING, required: false } },
      });
      expect(result).toBeInstanceOf(SchemaField);
    });

    it('should resolve REFERENCES type using registry', () => {
      const referencedType = { Type: Types.STRING, required: true };
      mockRegistry.get.mockReturnValue(referencedType);

      const result = adapter.factoryType({
        Type: Types.REFERENCES,
        options: { references: 'User' },
      });

      expect(mockRegistry.get).toHaveBeenCalledWith('User');
      expect(result).toBeInstanceOf(ScalarField);
    });

    it('should return UnknownField for unknown type', () => {
      const result = adapter.factoryType({ Type: 'INVALID_TYPE' });
      expect(result).toBeInstanceOf(UnknownField);
    });
  });
});
