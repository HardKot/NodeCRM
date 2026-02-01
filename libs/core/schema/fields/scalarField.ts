import { BaseField, ValidateResult } from './baseField';

import { ValidateError } from './fieldError.js';
import { Result } from '../../../utils';

type ScalarType = 'string' | 'number' | 'boolean';

class ScalarField extends BaseField {
  constructor(
    public readonly scalar: ScalarType,
    required: boolean = false
  ) {
    super(required);
  }

  override validate(value: any): ValidateResult {
    if (!this.required && value === undefined) return Result.success(null);
    if (typeof value === this.scalar) return Result.success(null);
    return Result.failure(
      new ValidateError(`Expected type '${this.scalar}' but got '${typeof value}'`)
    );
  }

  override transform(value: any) {
    if (value === undefined) return undefined;
    const transformer = ScalarField.supportTypes[this.scalar];
    return transformer?.(value) ?? value;
  }

  static supportTypes = {
    number: Number,
    string: String,
    boolean: Boolean,
  };
}

export { ScalarField, ScalarType };
