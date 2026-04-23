const { BaseField } = require('./baseField');
const { Result } = require('../utils');
const { ValidateError } = require('./fieldError');
class EnumField extends BaseField {
    values;
    constructor(values, required = false) {
        super(required, []);
        this.values = values;
        this.values = new Set(values).values().toArray();
    }
    typeValidate(value) {
        if (this.values.includes(value))
            return Result.success(null);
        return Result.failure(new ValidateError(`Value "${value}" is not in enum [${this.values.join(', ')}]`));
    }
    transform(value) {
        if (!this.values.includes(value))
            return undefined;
        return value;
    }
}

exports.EnumField = EnumField;