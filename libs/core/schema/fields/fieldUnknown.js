'use strict';

const { fieldParser } = require('../fieldParser.js');
const { BaseField } = require('./baseField.js');
const { Result } = require('../../../utils/index.js');
const { ValidateError } = require('./fieldError.js');

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

module.exports = { UnknownField };
