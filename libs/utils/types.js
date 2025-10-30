export function isObject(v) {
  if (typeof v === 'object') {
    return v !== null && !Array.isArray(v);
  }
  return typeof v === 'function';
}

export function isFunction(v) {
  return typeof v === 'function';
}

export function isUndefiend(v) {
  return v === undefined;
}

export function isSymbol(v) {
  return typeof v === 'symbol';
}

export function isPrimitive(v) {
  return ['number', 'bigint', 'boolean', 'string', 'undefiend', 'symbol'].includes(typeof v);
}

export function isNull(v) {
  return v === null;
}

export function isString(v) {
  return typeof v === 'string';
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
