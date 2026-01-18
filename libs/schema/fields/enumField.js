'use strict';

import { CheckResult } from '../checkResult.js';
import { BaseField } from './baseField.js';

class EnumField extends BaseField {
  #values;

  constructor(allowedValues, required) {
    super(required);
    this.#values = new Set(allowedValues);
    Object.freeze(this);
  }

  get values() {
    return Array.from(this.#values.values());
  }

  check(value) {
    if (!this.required && value === undefined) return CheckResult.Truthy;
    if (this.#values.has(value)) return CheckResult.Truthy;
    return new CheckResult(false, `Value "${value}" is not in enum [${this.values.join(', ')}]`);
  }

  transform(value) {
    if (!this.#values.has(value)) return undefined;
    return value;
  }
}

export { EnumField };
