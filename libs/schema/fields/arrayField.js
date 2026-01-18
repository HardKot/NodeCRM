'use strict';

import { CheckResult } from '../checkResult.js';
import { BaseField } from './baseField.js';
import { Types } from '../../utils/index.js';

class ArrayField extends BaseField {
  constructor(itemField, required) {
    super(required);
    this.itemField = itemField;
    this.required = required;
    Object.freeze(this);
  }

  check(value) {
    if (!this.required && value === undefined) return CheckResult.Truthy;
    if (!Array.isArray(value)) return CheckResult.Falsy;
    const checkResult = new CheckResult(true);
    const errors = value.map(item => this.itemField.check(item));

    for (let i = 0; i < errors.length; i++) {
      const error = errors[i];

      if (!error.valid) {
        checkResult.addError(error, `${i}`);
      }
    }

    return checkResult;
  }

  transform(value) {
    if (!value) return undefined;
    if (Types.isString(value)) value = JSON.parse(value);

    return value.map(item => this.itemField.transform(item));
  }
}

export { ArrayField };
