export declare class FunctionUtils {
    private constructor();
    static curry<T extends any[], U extends any[], R>(fn: (...args: [...T, ...U]) => R, ...preset: T): (...rest: U) => R;
}
