import { BaseField } from './baseField.js';
import { Result, Types } from '../../utils/index.js';
import { ValidateError } from './fieldError.js';

class SchemaField extends BaseField {
  constructor(schema, proto = null) {
    super(true);
    this.schema = schema;
    this.proto = proto;
    Object.freeze(this);
  }

  check(value) {
    if (!Types.isObject(value)) return Result.failure(new ValidateError('Expected an object'));

    let hasError = false;
    const error = new ValidateError('');

    for (const [key, field] of Object.entries(this.schema)) {
      const itemCheck = field.check(value[key]);
      if (itemCheck.isSuccess) continue;
      hasError = true;
      error.addError(itemCheck.errorOrNull(), key);
    }

    if (hasError) {
      return Result.failure(error);
    } else {
      return Result.success();
    }
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
