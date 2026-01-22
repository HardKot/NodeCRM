'use strict';

import { BaseField } from './baseField.js';
import { Result } from '../../utils';

import { ValidateError } from './fieldError.js';

class EnumField extends BaseField {
  #values;

  constructor(allowedValues, required) {
    super(required);
    this.#values = new Set(allowedValues);
  }

  get values() {
    return Array.from(this.#values.values());
  }

  check(value) {
    if (!this.required && value === undefined) return Result.success();
    if (this.#values.has(value)) return Result.success();
    return Result.failure(
      new ValidateError(`Value "${value}" is not in enum [${this.values.join(', ')}]`)
    );
  }

  transform(value) {
    if (!this.#values.has(value)) return undefined;
    return value;
  }
}

export { EnumField };
