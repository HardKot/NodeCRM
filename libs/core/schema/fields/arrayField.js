'use strict';

const { BaseField } = require('./baseField.js');
const { Result, Types } = require('../../../utils/types/objectUtils');

const { ValidateError } = require('./fieldError.js');

class ArrayField extends BaseField {
  constructor(itemField, required) {
    super(required);
    this.itemField = itemField;
    this.required = required;
  }

  validate(value) {
    if (!this.required && value === undefined) return Result.success();
    if (!Array.isArray(value)) return Result.failure(new ValidateError('Expected an array'));

    let hasError = false;
    const error = new ValidateError('');

    for (let i = 0; i < value.length; i++) {
      const itemCheck = this.itemField.validate(value[i]);
      if (itemCheck.isSuccess) continue;
      hasError = true;
      error.addError(itemCheck.errorOrNull(), `[${i}]`);
    }

    if (hasError) {
      return Result.failure(error);
    } else {
      return Result.success();
    }
  }

  transform(value) {
    if (!value) return undefined;
    if (Types.isString(value)) value = JSON.parse(value);

    return value.map(item => this.itemField.transform(item));
  }
}

module.exports = { ArrayField };
