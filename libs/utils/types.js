export function isObject(v) {
  return typeof v === 'object' && !Array.isArray(v);
}

export function isFunction(v) {
  return typeof v === 'function' && !v.toString().startsWith('class');
}

export function isClass(v) {
  return typeof v === 'function' && v.toString().startsWith('class');
}

export function isUndefined(v) {
  return v === undefined;
}

export function isSymbol(v) {
  return typeof v === 'symbol';
}

export function isPrimitive(v) {
  return ['number', 'bigint', 'boolean', 'string', 'undefined', 'symbol'].includes(typeof v);
}

export function isNull(v) {
  return v === null;
}

export function isString(v) {
  return typeof v === 'string';
}

export function isInt(v) {
  return Number.isInteger(v);
}

export function notNull(v) {
  if (typeof v === 'object') {
    return v !== null;
  }

  return false;
}

export function requireNotNull(v, params) {
  if (this.notNull(v)) return v;
  if (typeof params === 'function') params = params();

  if (params instanceof Error) throw params;
  if (typeof params === 'object') return params;
  throw new Error(params || 'Object is null or undefined');
}

export function requireArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  return [value];
}
