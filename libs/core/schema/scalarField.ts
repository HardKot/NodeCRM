import { BaseField, TestFunction, ValidateResult } from './baseField';

import { ValidateError } from './fieldError';
import { Result } from '../../utils';

const ScalarType = Object.freeze({
  String: 0,
  Number: 1,
  Boolean: 2,
  Int: 3,
});

class ScalarField extends BaseField {
  constructor(
    public readonly scalar: number,
    required: boolean = false,
    tests: TestFunction[] = []
  ) {
    super(required, tests);
  }

  protected override typeValidate(value: any): ValidateResult {
    switch (this.scalar) {
      case ScalarType.Int:
        if (typeof value === 'number' && Number.isInteger(value)) return Result.success(null);
        break;
      case ScalarType.Number:
        if (typeof value === 'number') return Result.success(null);
        break;
      case ScalarType.Boolean:
        if (typeof value === 'boolean') return Result.success(null);
        break;
      case ScalarType.String:
        if (typeof value === 'string') return Result.success(null);
        break;
    }
    return Result.failure(new ValidateError(`Invalid type, expected '${this.scalar}'`));
  }

  override transform(value: any) {
    if (value === undefined) return undefined;
    switch (this.scalar) {
      case ScalarType.Int:
        return this.toInt(value);
      case ScalarType.Number:
        return this.toNumber(value);
      case ScalarType.Boolean:
        return this.toBoolean(value);
      case ScalarType.String:
        return this.toString(value);
      default:
        return undefined;
    }
  }

  private toString(value: any): string {
    return String(value);
  }
  private toNumber(value: any): number | undefined {
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  }
  private toBoolean(value: any): boolean | undefined {
    if (typeof value === 'boolean') return value;
    if (value === 'true' || value === 1 || value === '1') return true;
    if (value === 'false' || value === 0 || value === '0') return false;
    return undefined;
  }
  private toInt(value: any): number | undefined {
    const num = Number(value);
    if (isNaN(num)) return undefined;
    return Math.floor(num);
  }
}

export { ScalarField, ScalarType };
