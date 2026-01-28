const { StringUtils } = require('./stringUtils');
const { Types } = require('./types.js');

class ParserError extends Error {}

class Parser {
  static of(props) {
    const parser = new Parser(props);
    return parser.parse.bind(parser);
  }

  constructor(props) {
    Object.assign(this, props);
    Object.freeze(this);
  }

  parse(source, options = {}) {
    const srcType = this.#sourceType(source);

    const parserName = StringUtils.factoryCamelCase('parse', srcType);
    const parser = this[parserName];

    if (!parser) {
      throw new ParserError(`Parser for source type "${srcType}" not implemented`);
    }

    return parser.call(this, source, options);
  }

  #sourceType(source) {
    if (Array.isArray(source)) return 'array';
    if (Types.isFunction(source)) return 'function';
    if (Types.isClass(source)) return 'class';
    return typeof source;
  }
}

module.exports = { Parser, ParserError };
