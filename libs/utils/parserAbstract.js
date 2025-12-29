import { factoryCamelCase } from './stringCase.js';

class ParserAbstract {
  parser(source) {
    const srcType = this.sourceType(source);

    const parserName = factoryCamelCase('parser', srcType);
    const parser = this[parserName];

    return parser?.call(this, source);
  }

  sourceType(source) {
    if (Array.isArray(source)) return 'array';
    if (typeof source === 'function')
      return source.toString().startsWith('class') ? 'class' : 'function';
    return typeof source;
  }

  parserString() {
    console.warn('parserString method not implemented');
  }

  parserObject() {
    console.warn('parserObject method not implemented');
  }

  parserArray() {
    console.warn('parserArray method not implemented');
  }

  parserNumber() {
    console.warn('parserNumber method not implemented');
  }

  parserBoolean() {
    console.warn('parserBoolean method not implemented');
  }

  parserUndefined() {
    console.warn('parserUndefined method not implemented');
  }

  parserFunction() {
    console.warn('parserFunction method not implemented');
  }

  parserSymbol() {
    console.warn('parserSymbol method not implemented');
  }

  parserClass() {
    console.warn('parserClass method not implemented');
  }
}

export { ParserAbstract };
