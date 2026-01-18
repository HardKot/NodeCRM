import { SchemaField } from './fields';
import { fieldParser } from './fieldParser.js';

class SchemaError extends Error {}

class Schema extends SchemaField {
  static parse(schemaDefinition) {
    if (typeof schemaDefinition !== 'object' || schemaDefinition === null) {
      throw new SchemaError('Schema definition must be a non-null object');
    }
    return fieldParser.parse(schemaDefinition);
  }
}

export { Schema, SchemaError };
