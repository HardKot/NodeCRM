import { Result, Types } from '#utils';
import { CoreError, ValidateError } from './errors.js';
import { ScalarType } from './enums.js';

class BaseSchema {
  constructor(options = {}) {
    this.require = options.require ?? false;
  }

  transform() {
    return null;
  }

  validate() {
    return false;
  }
}

class ReferenceSchema extends BaseSchema {
  constructor({ name, ...options } = {}) {
    super(options);
    if (!name) throw CoreError(`Reference name not found`);
    this.name = name;

    Object.freeze(this);
  }
}

class EnumSchema extends BaseSchema {
  constructor({ values, ...options } = {}) {
    super(options);
    if (!values) throw CoreError(`Enum values not found`);
    this.values = new Set(values).values().toArray();

    Object.freeze(this);
  }

  typeValidate(value) {
    if (this.values.includes(value)) return Result.success(null);
    return Result.failure(
      new ValidateError(`Value "${value}" is not in enum [${this.values.join(', ')}]`)
    );
  }

  transform(value) {
    if (!this.values.includes(value)) return undefined;
    return value;
  }

  [Symbol.iterator]() {
    return this.values[Symbol.iterator];
  }
}

class ArraySchema extends BaseSchema {
  constructor({ item, ...options } = {}) {
    super(options);
    if (!item) throw CoreError(`Array item not found`);

    this.item = item;

    Object.freeze(this);
  }

  transform(value) {
    if (!value) return undefined;
    try {
      if (Types.isString(value)) value = JSON.parse(value);
    } catch {
      return undefined;
    }
    if (!Array.isArray(value)) return undefined;
    return value.map(item => this.itemField.transform(item)).filter(item => item !== undefined);
  }

  validate(value) {
    if (!Array.isArray(value)) return Result.failure(new ValidateError('Expected an array'));
    let hasError = false;
    const error = new ValidateError('');
    for (let i = 0; i < value.length; i++) {
      this.itemField.validate(value[i]).fold(
        () => { },
        err => {
          hasError = true;
          error.addError(err, `[${i}]`);
        }
      );
    }
    if (hasError) return Result.failure(error);
    return Result.success(null);
  }
}

class ScalarSchema extends BaseSchema {
  constructor({ scalar, ...options } = {}) {
    super(options);
    if (!Types.isEnum(scalar, ScalarType)) throw new CoreError(`Scalar type not found`);
    this.scalar = scalar;
    this.transform = ScalarSchema.#scalarTransform[scalar];
    this.validate = v => {
      if (ScalarSchema.#scalarValidate[scalar](v)) return Result.success(null);
      return Result.failure(new ValidateError(`Invalid type, expected '${this.scalar}'`));
    };

    Object.freeze(this);
  }

  static #scalarTransform = {
    [ScalarType.Int]: v => {
      const num = Number(v);
      if (isNaN(num)) return undefined;
      return Math.floor(num);
    },
    [ScalarType.Boolean]: v => {
      if (Types.isBoolean(v)) return v;
      if (v === 'true' || v === 1 || v === '1') return true;
      if (v === 'false' || v === 0 || v === '0') return false;
      return undefined;
    },
    [ScalarType.Number]: v => {
      const num = Number(v);
      return isNaN(num) ? undefined : num;
    },
    [ScalarType.String]: v => String(v).replaceAll('\n').trim(),
    [ScalarType.Text]: v => String(v),
  };

  static #scalarValidate = {
    [ScalarType.Int]: Types.isInt,
    [ScalarType.Boolean]: Types.isBoolean,
    [ScalarType.Number]: Types.isNumber,
    [ScalarType.String]: v => Types.isString(v) && !v.includes('\n'),
    [ScalarType.Text]: v => Types.isString(v),
  };
}

class Schema extends BaseSchema {
  constructor({ schema, proto, ...options } = {}) {
    super(options);
    if (!schema) throw CoreError(`Schema not found`);

    this.schema = schema;
    this.proto = proto;

    for (const key in schema) {
      if (key in this) continue;
      this[key] = schema[key];
    }

    Object.freeze(this);
  }

  getInclude(name) {
    return this.schema[name] ?? null;
  }

  isInclude(name) {
    return name in this.schema;
  }

  typeValidate(value) {
    if (!Types.isRecord(value)) return Result.failure(new ValidateError('Expected an object'));
    let hasError = false;
    const error = new ValidateError('');
    for (const [key, field] of Object.entries(this.schema)) {
      field.validate(value[key]).fold(
        () => { },
        itemError => {
          hasError = true;
          error.addError(itemError, key);
        }
      );
    }
    if (hasError) return Result.failure(error);
    return Result.success(null);
  }

  transform(value) {
    if (value === undefined) return undefined;
    try {
      if (Types.isString(value)) value = JSON.parse(value);
      if (!Types.isRecord(value)) return undefined;
      const transformed = {};
      for (const [key, field] of Object.entries(this.schema)) {
        transformed[key] = field.transform(value[key]);
      }
      if (this.proto) Object.setPrototypeOf(transformed, this.proto);
      return transformed;
    } catch {
      return undefined;
    }
  }

  [Symbol.iterator]() {
    const keys = Object.keys(this.schema);

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

export { Schema };
