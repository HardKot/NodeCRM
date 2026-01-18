'use strict';

import { CheckResult } from '../checkResult.js';

class BaseField {
  constructor(required = false) {
    this.required = required;
  }

  check() {
    return CheckResult.Falsy;
  }

  transform(value) {
    return value;
  }
}

export { BaseField };
