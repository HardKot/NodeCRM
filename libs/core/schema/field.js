'use strict';

import { Types } from './types.js';

class AbstractField {
  constructor(required = false) {
    this.required = required;
  }

  check(value) {
    return false;
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
    if (!this.required && value === undefined) return true;
    return typeof value === this.scalar;
  }

  transform(value) {
    if (this.required && value === undefined) return undefined;
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
    if (!this.required && value === undefined) return true;
    return this.#values.has(value);
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
    if (!this.required && value === undefined) return true;
    if (!Array.isArray(value)) return false;
    return value.every(item => this.itemField.check(item));
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
    if (typeof value !== 'object' || value === null) return false;
    for (const [key, field] of Object.entries(this.schema)) {
      if (!field.check(value[key])) return false;
    }
    return true;
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
