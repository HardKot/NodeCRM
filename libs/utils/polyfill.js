import { StringUtils } from './stringUtils.js';

import { FunctionUtils } from './functionUtils.js';
class Polyfill {
  static run(config) {
    const polyfill = new Polyfill();
    if (config.stringToPolyfill) polyfill.stringPolyfill();
    if (config.namespaceJS) polyfill.namespaceJS();
    if (config.functionToPolyfill) polyfill.functionToPolyfill();
  }
  constructor() { }
  stringPolyfill() {
    if (!String.prototype.toCamelCase) {
      String.prototype.toCamelCase = function() {
        const parts = StringUtils.parse(String(this));
        return StringUtils.factoryCamelCase.apply(StringUtils, parts);
      };
    }
    if (!String.prototype.toPascalCase) {
      String.prototype.toPascalCase = function() {
        const parts = StringUtils.parse(String(this));
        return StringUtils.factoryPascalCase.apply(StringUtils, parts);
      };
    }
  }
  namespaceJS() {
    if (global.SpaceJS) return;
    global.SpaceJS = {
      Result: _Result,
      Optional: _Optional,
    };
  }
  functionToPolyfill() {
    if (!Function.prototype.curry) {
      Function.prototype.curry = function(...args) {
        return FunctionUtils.curry(this, ...args);
      };
    }
  }
}

export { Polyfill };
