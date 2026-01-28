const { SchemaField } = require('./fields');
const { fieldParser } = require('./fieldParser.js');

class SchemaError extends Error {}
class Schema extends SchemaField {
  constructor(field) {
    super(field.schema, field.proto);
  }

  validate(value) {
    const result = super.validate(value);
    delete result.errorOrNull()?.errors?.['*']; // Remove general error if exists
    return result;
  }

  static parse(schemaDefinition) {
    if (typeof schemaDefinition !== 'object' || schemaDefinition === null) {
      throw new SchemaError('Schema definition must be a non-null object');
    }
    const schema = fieldParser(schemaDefinition);
    if (schema instanceof SchemaField) Object.setPrototypeOf(schema, Schema.prototype);

    return schema;
  }
}

module.exports = { Schema, SchemaError };
