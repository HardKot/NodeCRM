import { Result } from '../../../utils';
import { ValidateError } from './fieldError.js';

type ValidateResult = Result<null, ValidateError>;

abstract class BaseField {
  constructor(public required: boolean = false) {}

  public validate(value: any) {
    return Result.failure(new ValidateError('Invalid item'));
  }

  public transform(value: any) {
    return value;
  }

  public parse<T>(value: any) {
    const transformer = this.transform(value) as T;
    const validateResult = this.validate(transformer);
    if (validateResult.isFailure) return validateResult;
    return Result.success<T>(transformer);
  }
}

export { BaseField, ValidateResult };
