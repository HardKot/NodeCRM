export class FunctionUtils {
  private constructor() {
    throw new Error('FunctionUtils is a static class and cannot be instantiated.');
  }

  static curry<
    F extends (...args: any) => any = never,
    A extends any[] = never,
    B extends any[] = never,
  >(fn: F, ...preset: A): (...rest: B) => ReturnType<F> {
    return (...rest: B) => fn(...preset, ...rest);
  }
}
