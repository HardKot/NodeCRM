import { BaseSchema } from './baseSchema.ts';
import type { BaseSchemaProps } from './baseSchema.ts';

export { ReferenceSchema };

interface ReferenceSchemaProps extends BaseSchemaProps {
  name: string;
}

class ReferenceSchema extends BaseSchema {
  readonly name: string;

  constructor({ name, ...options }: ReferenceSchemaProps) {
    super(options);
    this.name = name;

    Object.freeze(this);
  }
}
