import { SchemaField } from './fields';

class SchemaError extends Error {}

class Schema extends SchemaField {
  constructor(field: SchemaField) {
    super(field.schema, field.proto);
  }

  override validate(value: any) {
    const result = super.validate(value);
    delete result.errorOrNull()?.errors?.['*']; // Remove general error if exists
    return result;
  }
}

export { Schema, SchemaError };
