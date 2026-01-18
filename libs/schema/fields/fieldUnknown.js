'use strict';

import { CheckResult } from '../checkResult.js';
import { fieldParser } from '../fieldParser.js';
import { BaseField } from './baseField.js';

class UnknownField extends BaseField {
  check() {
    return CheckResult.Falsy;
  }

  transform(value) {
    return value;
  }

  static parse(source) {
    return fieldParser.parse(source);
  }
}

export { UnknownField };
