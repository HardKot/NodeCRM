import { StringUtils } from './stringUtils';
import { Result as _Result } from './result';
import { Optional as _Optional } from './optional';
import { FunctionUtils } from './functionUtils';

declare global {
  interface String {
    toCamelCase(): string;
    toPascalCase(): string;
  }

  interface Function {
    curry<T extends any[], U extends any[], R>(
      this: (...args: [...T, ...U]) => R,
      ...preset: T
    ): (...rest: U) => R;
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

class Polyfill {
  static run(config: PolyfillConfig): void {
    const polyfill = new Polyfill();

    if (config.stringToPolyfill) polyfill.stringPolyfill();
    if (config.namespaceJS) polyfill.namespaceJS();
    if (config.functionToPolyfill) polyfill.functionToPolyfill();
  }

  private constructor() {}

  private stringPolyfill(): void {
    if (!String.prototype.toCamelCase) {
      String.prototype.toCamelCase = function (): string {
        const parts = StringUtils.parse(String(this));
        return StringUtils.factoryCamelCase.apply(StringUtils, parts);
      };
    }

    if (!String.prototype.toPascalCase) {
      String.prototype.toPascalCase = function (): string {
        const parts = StringUtils.parse(String(this));
        return StringUtils.factoryPascalCase.apply(StringUtils, parts);
      };
    }
  }

  private namespaceJS(): void {
    if (global.SpaceJS) return;
    global.SpaceJS = {
      Result: _Result,
      Optional: _Optional,
    };
  }

  private functionToPolyfill(): void {
      if (!Function.prototype.curry) {
        Function.prototype.curry = function(...args) {
          return FunctionUtils.curry(this, ...args);
        };
      }

  };
}


export { Polyfill };
