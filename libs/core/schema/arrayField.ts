import { BaseField, TestFunction, ValidateResult } from './baseField';
import { Result, Types } from '../../utils';

import { ValidateError } from './fieldError';

class ArrayField extends BaseField {
  constructor(
    public itemField: BaseField,
    required: boolean = false,
    tests: TestFunction[] = []
  ) {
    super(required, tests);
  }

  override typeValidate(value: any): ValidateResult {
    if (!Array.isArray(value)) return Result.failure(new ValidateError('Expected an array'));

    let hasError = false;
    const error = new ValidateError('');

    for (let i = 0; i < value.length; i++) {
      this.itemField.validate(value[i]).fold(
        () => {},
        err => {
          hasError = true;
          error.addError(err, `[${i}]`);
        }
      );
    }

    if (hasError) return Result.failure(error);

    return Result.success(null);
  }

  override transform(value: any) {
    if (!value) return undefined;
    try {
      if (Types.isString(value)) value = JSON.parse(value) as any[];
    } catch (e) {
      return undefined;
    }

    if (!Array.isArray(value)) return undefined;
    return value.map(item => this.itemField.transform(item)).filter(item => item !== undefined);
  }
}

export { ArrayField };
