import { beforeEach, describe, it, expect } from '@jest/globals';
import { SchemaParser } from '../schemaParser';
import { Types } from '../Types.js';

describe('SchemaParser', () => {
  let parser;

  beforeEach(() => {
    parser = new SchemaParser();
  });

  it('parses a string with required flag', () => {
    const result = parser.parser('string');
    expect(result).toEqual({
      Type: Types.STRING,
      required: true,
      options: {},
    });
  });

  it('parses a string without required flag', () => {
    const result = parser.parser('string?');
    expect(result).toEqual({
      Type: Types.STRING,
      required: false,
      options: {},
    });
  });

  it('parses an array of strings', () => {
    const result = parser.parser(['string?']);
    expect(result).toEqual({
      Type: Types.ARRAY,
      required: true,
      options: {
        value: {
          Type: Types.STRING,
          required: false,
          options: {},
        },
      },
    });
  });

  it('parses an object with type and required flag', () => {
    const result = parser.parser({ type: 'number', required: true });
    expect(result).toEqual({
      Type: Types.NUMBER,
      required: true,
      options: {},
    });
  });

  it('parses an object with type only', () => {
    const result = parser.parser({ type: 'boolean' });
    expect(result).toEqual({
      Type: Types.BOOLEAN,
      required: false,
      options: {},
    });
  });

  it('parses a schema object', () => {
    const schema = { field: 'string?' };
    const result = parser.parser(schema);
    expect(result).toEqual({
      Type: Types.SCHEMA,
      required: true,
      options: {
        schema: {
          field: {
            Type: Types.STRING,
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
      Type: Types.UNKNOWN,
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
