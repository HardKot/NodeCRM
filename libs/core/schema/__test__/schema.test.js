const { Schema, SchemaError } = require('../schema.js');

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

describe('Validation of Schema Parsing', () => {
  it('should validate parsed schema fields correctly', () => {
    const schemaDefinition = {
      user: {
        name: 'string',
        age: 'number',
      },
      email: 'string?',
      password: 'string',
    };

    const schema = Schema.parse(schemaDefinition);

    const validData = {
      user: {
        name: 'John Doe',
        age: 25,
      },
      password: 'pass123',
    };

    const invalidDataMissingRequired = {
      user: 'Jane Doe',
      password: true,
    };

    const invalidDataWrongType = {
      user: {
        name: 'Jane Doe',
        age: '25',
      },
      password: 'pass123',
      email: 12345,
      age: 'thirty',
    };

    expect(schema.validate(validData).isSuccess).toBe(true);
    expect(schema.validate(invalidDataMissingRequired).errorOrNull()?.errors).toEqual({
      password: ["Expected type 'string' but got 'boolean'"],
      user: ['Expected an object'],
    });
    expect(schema.validate(invalidDataWrongType).errorOrNull()?.errors).toEqual({
      'user.age': ["Expected type 'number' but got 'string'"],
      email: ["Expected type 'string' but got 'number'"],
    });
  });
});
