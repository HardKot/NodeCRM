import { Result } from '../utils/result';
import { ValidateError } from '../core/errors';
import { BaseSchema } from './baseSchema';
import type { BaseSchemaProps } from './baseSchema';

export { EnumSchema };

interface EnumSchemaProps extends BaseSchemaProps {
  values: string[];
}

class EnumSchema extends BaseSchema {
  values: string[];

  constructor({ values, ...options }: EnumSchemaProps) {
    super(options);
    this.values = new Set(values).values().toArray();

    Object.freeze(this);
  }

  override validate(value: any) {
    if (this.values.includes(value)) return Result.success(null);
    return Result.failure(new ValidateError(`Value "${value}" is not in enum [${this.values.join(', ')}]`));
  }

  [Symbol.iterator]() {
    return this.values[Symbol.iterator];
  }
}
