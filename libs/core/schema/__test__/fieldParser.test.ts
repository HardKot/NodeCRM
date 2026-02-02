import { SourceFieldParser } from '../sourceFieldParser';
import { ScalarField, ScalarType } from '../scalarField';
import { EnumField } from '../enumField';
import { Schema } from '../schema';
import { ArrayField } from '../arrayField';
import { UnknownField } from '../fieldUnknown';

describe('SourceFieldParser', () => {
  let sourceFieldParser: SourceFieldParser;

  beforeEach(() => {
    jest.clearAllMocks();
    sourceFieldParser = new SourceFieldParser();
  });

  it('should parse scalar field from string', () => {
    const stringField = sourceFieldParser.parse('string') as ScalarField;
    const booleanField = sourceFieldParser.parse('boolean') as ScalarField;
    const numberField = sourceFieldParser.parse('number') as ScalarField;
    const intField = sourceFieldParser.parse('int') as ScalarField;

    const enumField = sourceFieldParser.parse('enum,enum2,enum3') as EnumField;

    expect(stringField).toBeInstanceOf(ScalarField);
    expect(booleanField).toBeInstanceOf(ScalarField);
    expect(numberField).toBeInstanceOf(ScalarField);
    expect(intField).toBeInstanceOf(ScalarField);

    expect(stringField.required).toBeTruthy();
    expect(booleanField.required).toBeTruthy();
    expect(numberField.required).toBeTruthy();
    expect(intField.required).toBeTruthy();

    expect(stringField.scalar).toBe(ScalarType.String);
    expect(booleanField.scalar).toBe(ScalarType.Boolean);
    expect(numberField.scalar).toBe(ScalarType.Number);
    expect(intField.scalar).toBe(ScalarType.Int);

    expect(enumField).toBeInstanceOf(EnumField);
    expect(enumField.values).toEqual(['enum', 'enum2', 'enum3']);
  });

  it('should parse optional scalar field from string', () => {
    const optionalStringField = sourceFieldParser.parse('?string') as ScalarField;

    expect(optionalStringField).toBeInstanceOf(ScalarField);
    expect(optionalStringField.scalar).toBe(ScalarType.String);
    expect(optionalStringField.required).toBeFalsy();
  });

  it('should parse schema field from object', () => {
    const schema = {
      name: 'string',
      age: '?number',
      isActive: 'boolean',
    };

    const schemaField = sourceFieldParser.parse(schema) as Schema;

    expect(schemaField).toBeInstanceOf(Schema);
    expect(schemaField.schema).toHaveProperty('name');
    expect(schemaField.schema).toHaveProperty('age');
    expect(schemaField.schema).toHaveProperty('isActive');

    expect(schemaField.schema['name']).toBeInstanceOf(ScalarField);
    expect(schemaField.schema['age']).toBeInstanceOf(ScalarField);
    expect(schemaField.schema['isActive']).toBeInstanceOf(ScalarField);
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

    const schemaField = sourceFieldParser.parse(schema);

    expect(schemaField).toBeInstanceOf(Schema);
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

    const schemaField = sourceFieldParser.parse(schema);

    expect(schemaField).toBeInstanceOf(Schema);
    const transformed = schemaField.transform({ name: 'John', age: 30 });
    expect(Object.getPrototypeOf(transformed)).toBe(Constructor.prototype);
  });

  it('should throw error for unsupported field type in string', () => {
    const unknownField = sourceFieldParser.parse('unsupportedType');

    expect(unknownField).toBeInstanceOf(UnknownField);
  });

  it('should parse field', () => {
    const arrayField = sourceFieldParser.parse(['string']) as ArrayField;

    expect(arrayField).toBeInstanceOf(ArrayField);
    expect(arrayField.itemField).toBeInstanceOf(ScalarField);
    expect((arrayField.itemField as ScalarField).scalar).toBe(ScalarType.String);
  });
});
