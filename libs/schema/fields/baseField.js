'use strict';

const { Result } = require('../../utils/index.js');
const { ValidateError } = require('./fieldError.js');

class BaseField {
  constructor(required = false) {
    this.required = required;
  }

  check() {
    return Result.failure(new ValidateError('Invalid item'));
  }

  transform(value) {
    return value;
  }
}

module.exports = { BaseField };
