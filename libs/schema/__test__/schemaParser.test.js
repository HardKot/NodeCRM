import { beforeEach, describe, it, expect } from '@jest/globals';
import { SchemaParser } from '../schemaParser.js';
import { FieldType } from '../fieldType.js';

describe('SchemaParser', () => {
  let parser;

  beforeEach(() => {
    parser = new SchemaParser();
  });

  it('parses a string with required flag', () => {
    const result = parser.parser('string');
    expect(result).toEqual({
      Type: FieldType.STRING,
      required: true,
      options: {},
    });
  });

  it('parses a string without required flag', () => {
    const result = parser.parser('string?');
    expect(result).toEqual({
      Type: FieldType.STRING,
      required: false,
      options: {},
    });
  });

  it('parses an array of strings', () => {
    const result = parser.parser(['string?']);
    expect(result).toEqual({
      Type: FieldType.ARRAY,
      required: true,
      options: {
        value: {
          Type: FieldType.STRING,
          required: false,
          options: {},
        },
      },
    });
  });

  it('parses an object with type and required flag', () => {
    const result = parser.parser({ type: 'number', required: true });
    expect(result).toEqual({
      Type: FieldType.NUMBER,
      required: true,
      options: {},
    });
  });

  it('parses an object with type only', () => {
    const result = parser.parser({ type: 'boolean' });
    expect(result).toEqual({
      Type: FieldType.BOOLEAN,
      required: false,
      options: {},
    });
  });

  it('parses a schema object', () => {
    const schema = { field: 'string?' };
    const result = parser.parser(schema);
    expect(result).toEqual({
      Type: FieldType.SCHEMA,
      required: true,
      options: {
        proto: {},
        schema: {
          field: {
            Type: FieldType.STRING,
            required: false,
            options: {},
          },
        },
      },
    });
  });

  it('returns null for unsupported primitive types', () => {
    const result = parser.parser({ type: 'unsupported' });
    expect(result).toEqual({
      Type: FieldType.UNKNOWN,
      required: false,
      options: {
        unknownType: 'unsupported',
      },
    });
  });

  it('throws an error for unsupported source types', () => {
    expect(() => parser.parser(123)).toThrow();
  });
});
