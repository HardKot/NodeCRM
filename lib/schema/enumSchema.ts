import { ValidateError } from '#constant';
import { Result, Types } from '#utils';

import { BaseSchema } from './baseSchema.ts';
import type { BaseSchemaProps } from './baseSchema.ts';

export { EnumSchema };

interface EnumSchemaProps extends BaseSchemaProps {
  values: string[];
}

class EnumSchema extends BaseSchema {
  #isNonIncludeMessage: string;
  #isNotStringMessage: string;
  values: string[];

  constructor({ values, ...options }: EnumSchemaProps) {
    super(options);
    this.values = [...new Set(values).values()];

    this.#isNotStringMessage = `Value "{value}" is not string! Is "{type}"`;
    this.#isNonIncludeMessage = `Value "{value}" is not in enum [${this.values.join(', ')}]`;

    Object.freeze(this);
  }

  override validate(value: unknown) {
    if (!Types.isString(value)) {
      return Result.failure(
        new ValidateError(this.#isNotStringMessage.replace('{value}', `${value}`).replace('{type}', typeof value))
      );
    }
    if (this.values.includes(value)) return Result.success(null);
    return Result.failure(new ValidateError(this.#isNonIncludeMessage.replace('{value}', value)));
  }

  [Symbol.iterator]() {
    return this.values[Symbol.iterator];
  }
}
