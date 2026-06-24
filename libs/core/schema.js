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

class ObjectSchema extends BaseSchema {
  constructor({ schema, proto, ...options } = {}) {
    super(options);
    if (!schema) throw CoreError(`Schema not found`);

    this.schema = schema;
    this.proto = proto;

    Object.freeze(this);
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
    } catch (e) {
      return undefined;
    }
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
}

class ArraySchema extends BaseSchema {
  constructor({ item, ...options } = {}) {
    super(options);
    if (!item) throw CoreError(`Array item not found`);

    this.item = item;

    Object.freeze(this);
  }

  transform() {
    if (!value) return undefined;
    try {
      if (Types.isString(value)) value = JSON.parse(value);
    } catch (e) {
      return undefined;
    }
    if (!Array.isArray(value)) return undefined;
    return value.map(item => this.itemField.transform(item)).filter(item => item !== undefined);
  }

  validate() {
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
    if (!scalar) throw CoreError(`Scalar type not found`);
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
    [ScalarType.String]: v => {
      if (Types.isString(v)) return v;
      return String(value);
    },
  };

  static #scalarValidate = {
    [ScalarType.Int]: Types.isInt,
    [ScalarType.Boolean]: Types.isBoolean,
    [ScalarType.Number]: Types.isNumber,
    [ScalarType.String]: Types.isString,
  };
}

const Schema = ObjectSchema;
Schema.Array = ArraySchema;
Schema.Scalar = ScalarSchema;
Schema.Enum = EnumSchema;

export { Schema };
