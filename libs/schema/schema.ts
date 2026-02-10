import { BaseField, ValidateResult } from './baseField';
import { Result, Types } from '../utils';
import { ValidateError } from './fieldError';

class Schema extends BaseField {
  constructor(
    public readonly schema: Record<string, BaseField>,
    public readonly proto: Object | null = null
  ) {
    super(true, []);
    this.schema = schema;
    this.proto = proto;
  }

  override typeValidate(value: any): ValidateResult {
    if (!Types.isRecord(value)) return Result.failure(new ValidateError('Expected an object'));

    let hasError = false;
    const error = new ValidateError('');

    for (const [key, field] of Object.entries(this.schema)) {
      field.validate(value[key]).fold(
        () => {},
        itemError => {
          hasError = true;
          error.addError(itemError, key);
        }
      );
    }

    if (hasError) return Result.failure(error);

    return Result.success(null);
  }

  override transform(value: any) {
    if (value === undefined) return undefined;
    try {
      if (Types.isString(value)) value = JSON.parse(value);
      if (!Types.isRecord(value)) return undefined;
      const transformed: Record<string, any> = {};
      for (const [key, field] of Object.entries(this.schema)) {
        transformed[key] = field.transform(value[key]);
      }
      if (this.proto) Object.setPrototypeOf(transformed, this.proto);
      return transformed;
    } catch (e) {
      return undefined;
    }
  }
}

export { Schema };
