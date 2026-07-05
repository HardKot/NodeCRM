import { Result } from '../utils/result';
import { ValidateError } from '../core/errors';

export { BaseSchema };

export interface BaseSchemaProps {
  require?: boolean;
}

abstract class BaseSchema {
  readonly require: boolean;

  constructor(options: BaseSchemaProps = {}) {
    this.require = options.require ?? false;
  }

  validate(v: any): Result {
    return Result.failure(new ValidateError('No implimeted'));
  }
}
