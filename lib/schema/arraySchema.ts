import { Result } from '../utils/result';
import { ValidateError } from '../core/errors.js';
import { BaseSchema } from './baseSchema';
import type { BaseSchemaProps } from './baseSchema';

export { ArraySchema };

interface ArraySchemaProps extends BaseSchemaProps {
  item: BaseSchema;
}

class ArraySchema extends BaseSchema {
  item: BaseSchema;

  constructor({ item, ...options }: ArraySchemaProps) {
    super(options);
    this.item = item;

    Object.freeze(this);
  }

  override validate(value: any) {
    if (!Array.isArray(value)) return Result.failure(new ValidateError('Expected an array'));
    let hasError = false;
    const error = new ValidateError('');
    for (let i = 0; i < value.length; i++) {
      this.item.validate(value[i]).fold(
        () => {},
        (err) => {
          hasError = true;
          error.addError(err, `[${i}]`);
        }
      );
    }
    if (hasError) return Result.failure(error);
    return Result.success(null);
  }
}
