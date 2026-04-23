const { BaseField } = require('./baseField');
const { Result, Types } = require('../utils');
const { ValidateError } = require('./fieldError');
class ArrayField extends BaseField {
    itemField;
    constructor(itemField, required = false, tests = []) {
        super(required, tests);
        this.itemField = itemField;
    }
    typeValidate(value) {
        if (!Array.isArray(value))
            return Result.failure(new ValidateError('Expected an array'));
        let hasError = false;
        const error = new ValidateError('');
        for (let i = 0; i < value.length; i++) {
            this.itemField.validate(value[i]).fold(() => { }, err => {
                hasError = true;
                error.addError(err, `[${i}]`);
            });
        }
        if (hasError)
            return Result.failure(error);
        return Result.success(null);
    }
    transform(value) {
        if (!value)
            return undefined;
        try {
            if (Types.isString(value))
                value = JSON.parse(value);
        }
        catch (e) {
            return undefined;
        }
        if (!Array.isArray(value))
            return undefined;
        return value.map(item => this.itemField.transform(item)).filter(item => item !== undefined);
    }
}

exports.ArrayField = ArrayField;