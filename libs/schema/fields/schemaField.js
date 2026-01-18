import { CheckResult } from '../checkResult.js';
import { BaseField } from './baseField.js';
import { Types } from '../../utils/index.js';

class SchemaField extends BaseField {
  constructor(schema, proto = null) {
    super(true);
    this.schema = schema;
    this.proto = proto;
    Object.freeze(this);
  }

  check(value) {
    if (typeof value !== 'object' || value === null) return CheckResult.Falsy;
    const errors = new CheckResult();

    for (const [key, field] of Object.entries(this.schema)) {
      const result = field.check(value[key]);
      if (!result.valid) {
        errors.addError(result, key);
      }
    }
    return errors;
  }

  transform(value) {
    if (Types.isString(value)) value = JSON.parse(value);

    const transformed = {};
    for (const [key, field] of Object.entries(this.schema)) {
      transformed[key] = field.transform(value[key]);
    }
    if (this.proto) Object.setPrototypeOf(transformed, this.proto);
    return transformed;
  }
}

export { SchemaField };
