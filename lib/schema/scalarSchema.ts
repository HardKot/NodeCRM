import { ScalarType, ValidateError } from '#constant';
import { Result, Types } from '#utils';

import { BaseSchema } from './baseSchema.ts';
import type { BaseSchemaProps } from './baseSchema.ts';

export { ScalarSchema };

interface ScalarSchemaProps extends BaseSchemaProps {
  scalar: IScalarValue;
}

const validates = {
  [ScalarType.INT]: (v: unknown) => Types.isInt(v),
  [ScalarType.BOOLEAN]: (v: unknown) => Types.isBoolean(v),
  [ScalarType.NUMBER]: (v: unknown) => Types.isNumber(v),
  [ScalarType.STRING]: (v: unknown) => Types.isString(v) && !v.includes('\n'),
  [ScalarType.TEXT]: (v: unknown) => Types.isString(v),
  [ScalarType.DATE]: (v: unknown) => Types.isInstanceOf(v, Date),
};

class ScalarSchema extends BaseSchema {
  readonly scalar: IScalarValue;
  readonly #validator: (v: unknown) => boolean;

  constructor({ scalar, ...options }: ScalarSchemaProps) {
    super(options);
    this.scalar = scalar;
    this.#validator = validates[scalar];

    Object.freeze(this);
  }

  override validate(v: unknown): Result {
    if (this.#validator(v)) return Result.success(null);
    return Result.failure(new ValidateError(`Invalid type, expected '${this.scalar}'`));
  }
}
