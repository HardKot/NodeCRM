module.exports = {
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
};
