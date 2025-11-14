import { beforeEach, describe, it, expect } from '@jest/globals';
import { SchemaParser, Type } from '../schemaParser';

describe('SchemaParser', () => {
  let parser;

  beforeEach(() => {
    parser = new SchemaParser();
  });

  it('parses a string with required flag', () => {
    const result = parser.parser('string!');
    expect(result).toEqual({
      Type: Type.string,
      required: true,
      field: null,
    });
  });

  it('parses a string without required flag', () => {
    const result = parser.parser('string');
    expect(result).toEqual({
      Type: Type.string,
      required: false,
      field: null,
    });
  });

  it('parses an array of strings', () => {
    const result = parser.parser(['string']);
    expect(result).toEqual({
      Type: Type.array,
      field: {
        Type: Type.string,
        required: false,
        field: null,
      },
    });
  });

  it('parses an object with type and required flag', () => {
    const result = parser.parser({ type: 'number', required: true });
    expect(result).toEqual({
      Type: Type.number,
      required: true,
      field: null,
    });
  });

  it('parses an object with type only', () => {
    const result = parser.parser({ type: 'boolean' });
    expect(result).toEqual({
      Type: Type.boolean,
      required: false,
      field: null,
    });
  });

  it('parses a schema object', () => {
    const schema = { field: 'value' };
    const result = parser.parser(schema);
    expect(result).toEqual({
      Type: Type.schema,
      required: false,
      field: schema,
    });
  });

  it('returns null for unsupported primitive types', () => {
    const result = parser.parser({ type: 'unsupported' });
    expect(result).toBeNull();
  });

  it('throws an error for unsupported source types', () => {
    expect(() => parser.parser(123)).toThrow();
  });
});
