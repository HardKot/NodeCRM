import { describe, it, expect, jest, beforeEach } from '@jest/globals';

import { Schema, SchemaError } from '../schema.js';

describe('Schema', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should parse schema definition into SchemaField', () => {
    const schemaDefinition = {
      title: 'string',
      age: 'number?',
      isActive: 'boolean',
    };

    const schemaField = Schema.parse(schemaDefinition);

    expect(schemaField).toBeDefined();
    expect(schemaField.schema).toHaveProperty('title');
    expect(schemaField.schema).toHaveProperty('age');
    expect(schemaField.schema).toHaveProperty('isActive');

    expect(schemaField.schema['title'].scalar).toBe('string');
    expect(schemaField.schema['title'].required).toBeTruthy();

    expect(schemaField.schema['age'].scalar).toBe('number');
    expect(schemaField.schema['age'].required).toBeFalsy();

    expect(schemaField.schema['isActive'].scalar).toBe('boolean');
    expect(schemaField.schema['isActive'].required).toBeTruthy();
  });

  it('should throw SchemaError for invalid schema definition', () => {
    expect(() => Schema.parse(null)).toThrow(SchemaError);
    expect(() => Schema.parse('invalid')).toThrow(SchemaError);
    expect(() => Schema.parse(42)).toThrow(SchemaError);
  });
});
