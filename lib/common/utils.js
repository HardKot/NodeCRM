export function firstNonNull(...args) {
  for (const arg of args) {
    if (arg !== null && arg !== undefined) {
      return arg;
    }
  }
  return null;
}

export function memoize(fn, ctx = null) {
  const cache = new Map();
  return function (...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn.apply(ctx ?? this, args);
    cache.set(key, result);
    setTimeout(() => cache.delete(key), 60000); // Cache expires in 60 seconds

    return result;
  };
}

export const Objects = Object.freeze({
  isObject(obj) {
    return obj && typeof obj === 'object' && !Array.isArray(obj);
  },
  notNull(obj) {
    return obj !== undefined && obj !== null;
  },
  isNull(obj) {
    return obj === null || obj === undefined;
  },
  requireNotNull(obj, params) {
    if (this.notNull(obj)) return obj;
    if (typeof params === 'function') params = params();

    if (params instanceof Error) throw params;
    if (typeof params === 'object') return params;
    throw new Error(params || 'Object is null or undefined');
  },
  deepFreeze(obj) {
    if (obj && typeof obj === 'object' && !Object.isFrozen(obj)) {
      Object.freeze(obj);
      Object.getOwnPropertyNames(obj).forEach(prop => this.deepFreeze(obj[prop]));
    }
    return obj;
  },
  mergeDeep(target, source) {
    if (this.isObject(target) && this.isObject(source)) {
      for (const key of Object.keys(source)) {
        if (this.isObject(source[key])) {
          if (!target[key]) Object.assign(target, { [key]: {} });
          this.mergeDeep(target[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }
    return target;
  },
});
