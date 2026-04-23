const { BaseField } = require('./baseField');
const { Result } = require('../utils');
const { ValidateError } = require('./fieldError');
class UnknownField extends BaseField {
    constructor() {
        super(false, []);
    }
    typeValidate() {
        return Result.failure(new ValidateError('Unknown field type cannot be validated'));
    }
    transform(value) {
        return value;
    }
}

exports.UnknownField = UnknownField;