'use strict';

import { fieldParser } from '../fieldParser.js';
import { BaseField } from './baseField.js';
import { Result } from '../../../utils/index.js';
import { ValidateError } from './fieldError.js';

class UnknownField extends BaseField {
  validate() {
    return Result.failure(new ValidateError('Unknown field type cannot be validated'));
  }

  transform(value) {
    return value;
  }

  static parse(source) {
    return fieldParser.parse(source);
  }
}

export { UnknownField };
