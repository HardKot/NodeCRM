import { factoryCamelCase } from './stringCase.js';
import { isClass, isFunction } from './types.js';

class ParserAbstract {
  parse(source) {
    const srcType = this.sourceType(source);

    const parserName = factoryCamelCase('parse', srcType);
    const parser = this[parserName];

    return parser?.call(this, source);
  }

  sourceType(source) {
    if (Array.isArray(source)) return 'array';
    if (isFunction(source)) return 'function';
    if (isClass(source)) return 'class';
    return typeof source;
  }

  parseString() {
    console.warn('parseString method not implemented');
    return {};
  }

  parseObject() {
    console.warn('parseObject method not implemented');
    return {};
  }

  parseArray() {
    console.warn('parseArray method not implemented');
    return {};
  }

  parseNumber() {
    console.warn('parseNumber method not implemented');
    return {};
  }

  parseBoolean() {
    console.warn('parseBoolean method not implemented');
    return {};
  }

  parseUndefined() {
    console.warn('parseUndefined method not implemented');
    return {};
  }

  parseFunction() {
    console.warn('parseFunction method not implemented');
    return {};
  }

  parseSymbol() {
    console.warn('parseSymbol method not implemented');
    return {};
  }

  parseClass() {
    console.warn('parseClass method not implemented');
    return {};
  }
}

export { ParserAbstract };
