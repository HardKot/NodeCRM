import { CheckResult } from '../checkResult.js';
import { BaseField } from './baseField.js';

class ScalarField extends BaseField {
  constructor(name, required) {
    super(required);
    this.scalar = name;
    Object.freeze(this);
  }

  check(value) {
    if (!this.required && value === undefined) return CheckResult.Truthy;
    if (typeof value === this.scalar) return CheckResult.Truthy;
    return new CheckResult(false, `Expected type ${this.scalar} but got ${typeof value}`);
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
