import { ValidateError } from '#constant';
import { Result } from '#utils';

export { BaseSchema };

export interface BaseSchemaProps {
  required?: boolean;
}

class BaseSchema {
  readonly required: boolean;

  constructor(options: BaseSchemaProps = {}) {
    this.required = options.required ?? false;
  }

  validate(v: unknown): Result {
    return Result.failure(new ValidateError(`No implimeted, getted parametr v=${v}`));
  }
}
