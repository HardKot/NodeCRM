import { SchemaField } from './fields';
import { fieldParser } from './fieldParser.js';
import { SchemaError } from './schemaError.js';

class Schema extends SchemaField {
  constructor(field) {
    super(field.schema, field.proto);
    Object.freeze(this);
  }

  check(value) {
    const result = super.check(value);
    delete result.errorOrNull()?.errors?.['*']; // Remove general error if exists
    return result;
  }

  static parse(schemaDefinition) {
    if (typeof schemaDefinition !== 'object' || schemaDefinition === null) {
      throw new SchemaError('Schema definition must be a non-null object');
    }

    return new Schema(fieldParser.parse(schemaDefinition));
  }
}

export { Schema };
