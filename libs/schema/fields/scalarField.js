import { BaseField } from './baseField.js';
import { Result } from '../../utils/index.js';

import { ValidateError } from './fieldError.js';

class ScalarField extends BaseField {
  constructor(name, required) {
    super(required);
    this.scalar = name;
  }

  check(value) {
    if (!this.required && value === undefined) return Result.success();
    if (typeof value === this.scalar) return Result.success();
    return Result.failure(
      new ValidateError(`Expected type '${this.scalar}' but got '${typeof value}'`)
    );
  }

  transform(value) {
    if (value === undefined) return undefined;
    const transformer = ScalarField.supportTypes[this.scalar];
    return transformer?.(value) ?? value;
  }

  static supportTypes = {
    number: Number,
    string: String,
    boolean: Boolean,
  };
}

export { ScalarField };
