'use strict';

import { Result } from '../../../utils/index.js';
import { ValidateError } from './fieldError.js';

class BaseField {
  constructor(required = false) {
    this.required = required;
  }

  validate() {
    return Result.failure(new ValidateError('Invalid item'));
  }

  transform(value) {
    return value;
  }
}

export { BaseField };
