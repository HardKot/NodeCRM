import { Result } from '../utils/result';
import { Types } from '../utils/types';
import { ValidateError } from '../core/errors';
import { BaseSchema } from './baseSchema';
import type { BaseSchemaProps } from './baseSchema';
import { ScalarType } from './enums';
import { ScalarValue } from './interface';

export { ScalarSchema };

interface ScalarSchemaProps extends BaseSchemaProps {
  scalar: ScalarValue;
}

const validates = {
  [ScalarType.Int]: (v: any) => Types.isInt(v),
  [ScalarType.Boolean]: (v: any) => Types.isBoolean(v),
  [ScalarType.Number]: (v: any) => Types.isNumber(v),
  [ScalarType.String]: (v: any) => Types.isString(v) && !v.includes('\n'),
  [ScalarType.Text]: (v: any) => Types.isString(v),
  [ScalarType.Date]: (v: any) => Types.isInstanceOf(v, Date),
};

class ScalarSchema extends BaseSchema {
  readonly scalar: ScalarValue;
  readonly #validator: (v: any) => boolean;

  constructor({ scalar, ...options }: ScalarSchemaProps) {
    super(options);
    this.scalar = scalar;
    this.#validator = validates[scalar];

    Object.freeze(this);
  }

  override validate(v: any): Result {
    if (this.#validator(v)) return Result.success(null);
    return Result.failure(new ValidateError(`Invalid type, expected '${this.scalar}'`));
  }
}
