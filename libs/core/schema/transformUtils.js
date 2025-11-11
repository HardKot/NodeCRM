const Transform = {
  auto(value) {
    return value;
  },
  int(value) {
    return Number.parseInt(value);
  },
  float(value) {
    return Number.parseFloat(value);
  },
  number(value) {
    return Number(value);
  },
  string(value) {
    return String(value);
  },
  char(value) {
    return String(value)[0];
  },
  boolean(value) {
    return Boolean(value);
  },
  array(value, type) {
    const fnType = typeof type === 'function' ? type : this[type];

    if (Array.isArray(value)) {
      return value.map(fnType);
    }

    const result = [];
    for (const key in value) {
      result.push(fnType(value[key]));
    }

    return result;
  },
  set(value, type) {
    const fnType = typeof type === 'function' ? type : this[type];

    if (value instanceof Set) {
      const result = new Set();
      value.forEach(value => {
        result.add(fnType(value));
      });

      return result;
    }

    if (Array.isArray(value)) {
      return new Set(value.map(fnType));
    }

    const result = new Set();
    for (const key in value) {
      result.add(fnType(value[key]));
    }

    return result;
  },
  map(value, type, keyType = undefined) {
    const fnType = typeof type === 'function' ? type : this[type];
    const fnKey = typeof keyType === 'function' ? keyType : this[type];

    if (value instanceof Map) {
      const result = new Map();
      value.forEach((value, key) => {
        result.set(fnKey(key), fnType(value));
      });

      return result;
    }

    if (Array.isArray(value)) {
      return new Map(value.map(it => [fnKey(it[0]), fnType(it[1])]));
    }

    const result = new Map();
    for (const key in value) {
      result.set(fnKey(key), fnType(value[key]));
    }

    return result;
  },
  date(value) {
    if (value instanceof Date) {
      return value;
    }

    if (typeof value === 'string') {
      return new Date(Date.parse(value));
    }

    if (typeof value === 'number') {
      return new Date(value);
    }

    if (Array.isArray(value)) {
      return new Date(...value);
    }

    return new Date(value);
  },
};

export { Transform };
