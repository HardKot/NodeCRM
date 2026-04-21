import { Result as _Result } from './result';
import { Optional as _Optional } from './optional';
declare global {
    interface String {
        toCamelCase(): string;
        toPascalCase(): string;
    }
    interface Function {
        curry<T extends any[], U extends any[], R>(this: (...args: [...T, ...U]) => R, ...preset: T): (...rest: U) => R;
    }
    namespace SpaceJS {
        const Result: typeof _Result;
        const Optional: typeof _Optional;
    }
}
interface PolyfillConfig {
    stringToPolyfill?: boolean;
    functionToPolyfill?: boolean;
    namespaceJS?: boolean;
}
declare class Polyfill {
    static run(config: PolyfillConfig): void;
    private constructor();
    private stringPolyfill;
    private namespaceJS;
    private functionToPolyfill;
}
export { Polyfill };
