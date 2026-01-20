const { factoryCamelCase } = require('./stringCase.js');
const { Types } = require('./types.js');

class ParserError extends Error {}

class Parser {
  constructor(props) {
    Object.assign(this, props);
    Object.freeze(this);
  }

  sourceType(source) {
    if (Array.isArray(source)) return 'array';
    if (Types.isFunction(source)) return 'function';
    if (Types.isClass(source)) return 'class';
    return typeof source;
  }

  parse(source, options = {}) {
    const srcType = this.sourceType(source);

    const parserName = factoryCamelCase('parse', srcType);
    const parser = this[parserName];

    if (!parser) {
      throw new ParserError(`Parser for source type "${srcType}" not implemented`);
    }

    return parser.call(this, source, options);
  }
}

module.exports = { Parser };
