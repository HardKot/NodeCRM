export class FunctionUtils {
  private constructor() {
    throw new Error('FunctionUtils is a static class and cannot be instantiated.');
  }

  static curry<T extends any[], U extends any[], R>(
    fn: (...args: [...T, ...U]) => R,
    ...preset: T
  ): (...rest: U) => R {
    return (...rest: U) => fn(...preset, ...rest);
  }
}
