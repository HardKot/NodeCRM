import { Result, Types } from '#utils';

import { ArraySchema } from './arraySchema.ts';
import { BaseSchema } from './baseSchema.ts';
import { EnumSchema } from './enumSchema.ts';
import { ReferenceSchema } from './referenceSchema.ts';
import { ScalarSchema } from './scalarSchema.ts';

import type { BaseSchemaProps } from './baseSchema.ts';
import { ValidateError } from '#constant';

export { Schema };

type SchemaBody = { [key: string]: BaseSchema };

interface SchemaProps<T extends SchemaBody, U> extends BaseSchemaProps {
  schema: T;
  proto?: U;
}

class Schema<T extends SchemaBody = SchemaBody, U = null> extends BaseSchema {
  #schema: T;
  #proto: U | null;

  constructor({ schema, proto, ...options }: SchemaProps<T, U>) {
    super(options);

    this.#schema = schema;
    this.#proto = proto ?? null;

    Object.freeze(this);
  }

  changeProto(value: any) {
    if (!this.#proto) return null;
    return Object.create(value, this.#proto);
  }

  getInclude(name: string) {
    return this.#schema[name] ?? null;
  }

  isInclude(name: string) {
    return name in this.#schema;
  }

  validate(value: any) {
    if (!Types.isRecord(value)) return Result.failure(new ValidateError('Expected an object'));
    let hasError = false;
    const error = new ValidateError('');
    for (const [key, field] of Object.entries(this.#schema)) {
      field.validate(value[key]).fold(
        () => { },
        (itemError) => {
          hasError = true;
          error.addError(itemError, key);
        }
      );
    }
    if (hasError) return Result.failure(error);
    return Result.success(null);
  }

  [Symbol.iterator]() {
    const keys = Object.keys(this.#schema);

    return {
      next: () => {
        if (keys.length) {
          return { value: keys.shift(), done: false };
        }
        return { done: true };
      },
    };
  }

  static Array = ArraySchema;
  static Scalar = ScalarSchema;
  static Enum = EnumSchema;
  static Reference = ReferenceSchema;
}
