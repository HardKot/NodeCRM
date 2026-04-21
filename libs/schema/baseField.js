import { Result } from '../utils';
import { ValidateError } from './fieldError';
class BaseField {
    required;
    tests;
    constructor(required, tests) {
        this.required = required;
        this.tests = tests;
    }
    validate(value) {
        if (!this.required && value === undefined)
            return Result.success(null);
        const typeValidateResult = this.typeValidate(value);
        if (typeValidateResult.isFailure)
            return typeValidateResult;
        return this.test(value);
    }
    transform(value) {
        return value;
    }
    test(value) {
        for (const validator of this.tests) {
            const result = validator(value);
            if (!result[0])
                return Result.failure(new ValidateError(result[1]));
        }
        return Result.success(null);
    }
    typeValidate(value) {
        return Result.failure(new ValidateError('Invalid item'));
    }
    parse(value) {
        const transformer = this.transform(value);
        const validateResult = this.validate(transformer);
        if (validateResult.isFailure)
            return validateResult;
        return Result.success(transformer);
    }
}
export { BaseField };
