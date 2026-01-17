class TypeError extends Error {}

class Types {
  constructor() {
    throw new Error('Types is a static class and cannot be instantiated');
  }

  static isObject(v) {
    return typeof v === 'object' && !Array.isArray(v);
  }

  static isFunction(v) {
    if (typeof v !== 'function') return false;
    const str = Function.prototype.toString.call(v);
    return !str.startsWith('class ');
  }

  static isClass(v) {
    if (typeof v !== 'function') return false;
    const str = Function.prototype.toString.call(v);
    return str.startsWith('class ');
  }

  static isUndefined(v) {
    return v === undefined;
  }

  static isSymbol(v) {
    return typeof v === 'symbol';
  }

  static isPrimitive(v) {
    return ['number', 'bigint', 'boolean', 'string', 'undefined', 'symbol'].includes(typeof v);
  }

  static isNull(v) {
    return v === null;
  }

  static isString(v) {
    return typeof v === 'string';
  }

  static isNumber(v) {
    return typeof v === 'number' && !Number.isNaN(v);
  }

  static isInt(v) {
    return Number.isInteger(v);
  }

  static notNull(v) {
    if (typeof v === 'object') {
      return v !== null;
    }

    return false;
  }
}

export { Types, TypeError };
