const PRIMITIVE_TYPE = {
  int: value => Number.parseInt(value),
  float: value => Number.parseFloat(value),
  string: value => `${value}`,
  char: value => `${value}`[0],
  number: value => +value,
  boolean: value => !!value,
  date: value => {
    if (value instanceof Date) return new Date(value);
    if (typeof value === 'string') return new Date(value);
    if (typeof value === 'number') return new Date(value);
    return null;
  },
};
const COLLECTION_TYPE = {
  array: (options, value) => {
    let result = [];
    if (Array.isArray(value)) {
      result = value.map(it => options.value(it));
    }
    if (value instanceof Set) {
      for (const it of value.values()) {
        result.push(options.value(it));
      }
    }
    if (value instanceof Map) {
      for (const it of value.values()) {
        result.push(options.value(it));
      }
    }
    if (typeof value === 'string') {
      result = value.split(';').map(it => options.value(it));
    }
    if (typeof value === 'object') {
      for (const key in value) {
        result.push(options.value(value[key]));
      }
    }
    return result;
  },
  set: (options, value) => {
    const array = COLLECTION_TYPE.array(value, options);

    return new Set(array);
  },
  map: (options, value) => {
    const result = new Map();
    if (value instanceof Map) {
      for (const [key, it] of value.entries()) {
        result.set(options.key(key), options.value(it));
      }
    }
    if (typeof value === 'string') {
      for (const [key, value] of value.split(';').map(it => it.split('='))) {
        result.set(options.key(key), options.value(value));
      }
    }
    if (typeof value === 'object') {
      for (const key in value) {
        result.set(options.key(key), options.value(value[key]));
      }
    }
    return result;
  },
  record: (options, value) => {
    const result = [];
    const collection = COLLECTION_TYPE.map(value, options);
    for (const [key, value] of collection.entries()) {
      result.push([`${key}`, value]);
    }
    return Object.fromEntries(result);
  },
};

const DEFAULT_VALIDATORS = {
  min: options => value => value >= options.min,
  max: options => value => value <= options.max,
  size: options => value => (value.length ?? value.size) <= options.size,
  required: () => value => value !== undefined && value !== null,
  before: options => value => value.getTime() < options.before.getTime(),
  after: options => value => value.getTime() > options.after.getTime(),
  match: options => value => options.match.test(value),
  fn: options => value => options.fn(value),
};

class SchemaParser {
  #random;

  constructor(random) {
    this.#random = random;
  }

  parse(structure) {
    const fields = {};

    for (const field in structure) {
      const value = structure[field];

      if (typeof value === 'string') {
        fields[field] = [{ relative: value }];
        continue;
      }
      let transform = this.factoryTransform(value);
      let validator = this.factoryValidators(value);

      if (!transform) transform = { relative: value.type };
      fields[field] = [transform, validator];
    }

    return fields;
  }

  factoryTransform(field) {
    let transform = PRIMITIVE_TYPE[field.type];
    if (!!transform) return transform;

    transform = COLLECTION_TYPE[field.type];
    if (!transform) return null;

    const { type, value = 'unknown', key = 'unknown' } = field;

    const keyTransform = PRIMITIVE_TYPE[key];
    const valueTransform = PRIMITIVE_TYPE[value];

    return COLLECTION_TYPE[type]({ key: keyTransform, value: valueTransform });
  }

  factoryValidators(field) {
    const { type, ...options } = field;

    const validators = {};

    for (const name in options) {
      let value = options[name];
      let message = '';
      if (Array.isArray(value)) [value, message] = value;

      const validator = DEFAULT_VALIDATORS[name];
      if (!validator) continue;
      validators[name] = [validator, message];
    }
    Object.freeze(validators);

    return validators;
  }
}

export { SchemaParser };
