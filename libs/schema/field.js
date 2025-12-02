'use strict';

import { Types } from './types.js';
import { CheckResult } from './checkResult.js';

class AbstractField {
  constructor(required = false) {
    this.required = required;
  }

  check(value) {
    return CheckResult.Falsy;
  }

  transform(value) {
    return value;
  }
}

class ScalarField extends AbstractField {
  constructor(name, required) {
    super(required);
    this.scalar = name;
    Object.freeze(this);
  }

  check(value) {
    if (!this.required && value === undefined) return CheckResult.Truthy;
    if (typeof value === this.scalar) return CheckResult.Truthy;
    return new CheckResult(false, `Expected type ${this.scalar} but got ${typeof value}`);
  }

  transform(value) {
    if (!value === undefined) return undefined;
    switch (this.scalar) {
      case Types.NUMBER:
        return Number(value);
      case Types.STRING:
        return String(value);
      case Types.BOOLEAN:
        return Boolean(value);
      default:
        return value;
    }
  }
}

class EnumField extends AbstractField {
  /**@type {Set<String>} */
  #values;

  constructor(allowedValues, required) {
    super(required);
    this.#values = new Set(allowedValues);
    Object.freeze(this);
  }

  get values() {
    return Array.from(this.#values.values());
  }

  check(value) {
    if (!this.required && value === undefined) return CheckResult.Truthy;
    if (this.#values.has(value)) return CheckResult.Truthy;
    return new CheckResult(false, `Value "${value}" is not in enum [${this.values.join(', ')}]`);
  }

  transform(value) {
    return value;
  }
}

class ArrayField extends AbstractField {
  constructor(itemField, required) {
    super(required);
    this.itemField = itemField;
    this.required = required;
    Object.freeze(this);
  }

  check(value) {
    if (!this.required && value === undefined) return CheckResult.Truthy;
    if (!Array.isArray(value)) return CheckResult.Falsy;
    const checkResult = new CheckResult(true);
    const errors = value.map(item => this.itemField.check(item));

    for (let i = 0; i < errors.length; i++) {
      const error = errors[i];

      if (!error.valid) {
        checkResult.addError(error, `${i}`);
      }
    }

    return checkResult;
  }

  transform(value) {
    if (value) return undefined;
    return value.map(item => this.itemField.transform(item));
  }
}

class SchemaField extends AbstractField {
  constructor(schema) {
    super(true);
    this.schema = schema;
    Object.freeze(this);
  }

  check(value) {
    if (typeof value !== 'object' || value === null) return CheckResult.Falsy;
    const errors = new CheckResult();

    for (const [key, field] of Object.entries(this.schema)) {
      const result = field.check(value[key]);
      if (!result.valid) {
        errors.addError(result, key);
      }
    }
    return errors;
  }

  transform(value) {
    const transformed = {};
    for (const [key, field] of Object.entries(this.schema)) {
      transformed[key] = field.transform(value[key]);
    }
    return transformed;
  }
}

class UnknownField extends AbstractField {
  constructor() {
    super(false);
    Object.freeze(this);
  }
}

export { AbstractField, ScalarField, EnumField, ArrayField, SchemaField, UnknownField };
