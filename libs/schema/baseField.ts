import { Result } from '../utils';
import { ValidateError } from './fieldError';

type ValidateResult = Result<null, ValidateError>;
type TestFunction = (value: any) => [boolean, string];

abstract class BaseField {
  protected constructor(
    public required: boolean,
    public tests: TestFunction[]
  ) {}

  public validate(value: any) {
    if (!this.required && value === undefined) return Result.success(null);
    const typeValidateResult = this.typeValidate(value);
    if (typeValidateResult.isFailure) return typeValidateResult;
    return this.test(value);
  }

  public transform(value: any) {
    return value;
  }

  protected test(value: any): ValidateResult {
    for (const validator of this.tests) {
      const result = validator(value);
      if (!result[0]) return Result.failure(new ValidateError(result[1]));
    }
    return Result.success(null);
  }

  protected typeValidate(value: any): ValidateResult {
    return Result.failure(new ValidateError('Invalid item'));
  }

  public parse<T>(value: any) {
    const transformer = this.transform(value) as T;
    const validateResult = this.validate(transformer);
    if (validateResult.isFailure) return validateResult;
    return Result.success<T>(transformer);
  }
}

export { BaseField, ValidateResult, TestFunction };
