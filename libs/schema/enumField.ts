import { BaseField, ValidateResult } from './baseField';
import { Result } from '../utils';

import { ValidateError } from './fieldError';

class EnumField extends BaseField {
  constructor(
    public readonly values: string[],
    required: boolean = false
  ) {
    super(required, []);
    this.values = new Set(values).values().toArray();
  }

  override typeValidate(value: any): ValidateResult {
    if (this.values.includes(value)) return Result.success(null);
    return Result.failure(
      new ValidateError(`Value "${value}" is not in enum [${this.values.join(', ')}]`)
    );
  }

  transform(value: any) {
    if (!this.values.includes(value)) return undefined;
    return value;
  }
}

export { EnumField };
