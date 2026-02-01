import { BaseField, ValidateResult } from './baseField';
import { Result } from '../../../utils';
import { ValidateError } from './fieldError';

class UnknownField extends BaseField {
  override validate(): ValidateResult {
    return Result.failure(new ValidateError('Unknown field type cannot be validated'));
  }

  override transform(value: any) {
    return value;
  }
}

export { UnknownField };
