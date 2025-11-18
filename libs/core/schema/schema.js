'use strict';

import { Types } from './types.js';

class SchemaError extends Error {}

class Schema {
  constructor(name, definition, preprocessor) {
    this.name = name;
    this.fields = new Set();
    const { Type, required, options } = definition;

    if (Type === Types.SCHEMA) {
      for (const [field, def] of Object.entries(options.schema)) {
        this.fields.add(field);
        this[field] = preprocessor.buildField(def.Type, def.required, def.options);
      }
    } else {
      this.value = preprocessor.buildField(Type, require, options);
    }
  }

  // check(value) {
  //   const errors = [];
  //
  //   for (const field in this) {
  //     if (!(field instanceof AbstractSchemaType)) continue;
  //     const schemaType = this[field];
  //     const fieldValue = value[field];
  //
  //     const result = !schemaType.check(fieldValue);
  //
  //     if (result) errors.push(result);
  //   }
  //
  //   return {
  //     valid: !errors.length,
  //     errors: errors,
  //   };
  // }
  //
  // transform(value) {
  //   const computed = {};
  //
  //   for (const field in this) {
  //     if (!(field instanceof AbstractSchemaType)) continue;
  //     const schemaType = this[field];
  //     const fieldValue = value[field];
  //
  //     computed[field] = schemaType.transform(fieldValue);
  //   }
  //
  //   return computed;
  // }
}

export { Schema };
