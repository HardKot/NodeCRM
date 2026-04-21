import { BaseField } from './baseField';
import { Result } from '../utils';
import { ValidateError } from './fieldError';
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
