import { BaseField } from './baseField.js';
import { Result } from '../utils/index.js';
import { ValidateError } from './fieldError.js';
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

export { UnknownField };