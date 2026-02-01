const { fieldParser } = require('../sourceFieldParser.ts');
const { Field } = require('../field.js');

describe('Field Parser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should parse scalar field from string', () => {
    const stringField = fieldParser('string');
    const booleanField = fieldParser('boolean');
    const numberField = fieldParser('number');
    const enumField = fieldParser('enum|enum2|enum3');

    expect(stringField).toBeInstanceOf(Field.Scalar);
    expect(stringField.scalar).toBe('string');
    expect(stringField.required).toBeTruthy();

    expect(booleanField).toBeInstanceOf(Field.Scalar);
    expect(booleanField.scalar).toBe('boolean');
    expect(booleanField.required).toBeTruthy();

    expect(numberField).toBeInstanceOf(Field.Scalar);
    expect(numberField.scalar).toBe('number');
    expect(numberField.required).toBeTruthy();

    expect(enumField).toBeInstanceOf(Field.Enum);
    expect(enumField.values).toEqual(['enum', 'enum2', 'enum3']);
  });

  it('should parse optional scalar field from string', () => {
    const optionalStringField = fieldParser('string?');

    expect(optionalStringField).toBeInstanceOf(Field.Scalar);
    expect(optionalStringField.scalar).toBe('string');
    expect(optionalStringField.required).toBeFalsy();
  });

  it('should parse schema field from object', () => {
    const schema = {
      name: 'string',
      age: 'number?',
      isActive: 'boolean',
    };

    const schemaField = fieldParser(schema);

    expect(schemaField).toBeInstanceOf(Field.Schema);
    expect(schemaField.schema).toHaveProperty('name');
    expect(schemaField.schema).toHaveProperty('age');
    expect(schemaField.schema).toHaveProperty('isActive');

    expect(schemaField.schema['name']).toBeInstanceOf(Field.Scalar);
    expect(schemaField.schema['age']).toBeInstanceOf(Field.Scalar);
    expect(schemaField.schema['isActive']).toBeInstanceOf(Field.Scalar);
  });

  it('should parse schema field with Prototype from object', () => {
    const proto = {
      greet() {
        return 'Hello';
      },
    };
    const schema = {
      Prototype: proto,
      name: 'string',
      age: 'number',
    };

    const schemaField = fieldParser(schema);

    expect(schemaField).toBeInstanceOf(Field.Schema);
    const transformed = schemaField.transform({ name: 'John', age: 30 });
    expect(Object.getPrototypeOf(transformed)).toBe(proto);
  });

  it('should parse schema field with Constructor from object', () => {
    class Constructor {
      greet() {
        return 'Hello from Constructor';
      }
    }

    const schema = {
      Constructor: Constructor,
      name: 'string',
      age: 'number',
    };

    const schemaField = fieldParser(schema);

    expect(schemaField).toBeInstanceOf(Field.Schema);
    const transformed = schemaField.transform({ name: 'John', age: 30 });
    expect(Object.getPrototypeOf(transformed)).toBe(Constructor.prototype);
  });

  it('should throw error for unsupported field type in string', () => {
    expect(() => fieldParser('unsupportedType')).toThrow('Unsupported field type: unsupportedType');
  });

  it('should parse field', () => {
    const arrayField = fieldParser(['string']);

    expect(arrayField).toBeInstanceOf(Field.Array);
    expect(arrayField.itemField).toBeInstanceOf(Field.Scalar);
    expect(arrayField.itemField.scalar).toBe('string');
  });
});
