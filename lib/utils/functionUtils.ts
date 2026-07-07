class FunctionUtils {
  constructor() {
    throw new Error('FunctionUtils is a static class and cannot be instantiated.');
  }

  static memo<U, UU>(fn: { (first: U): UU }, caches?: Map<U, UU>): { (first: U): UU } {
    if (!caches) caches = new Map();

    return function(arg: U): UU {
      const cache = caches.get(arg);
      if (cache) return cache;

      const value = fn(arg);
      caches.set(arg, value);

      return value;
    };
  }
}

export { FunctionUtils };
