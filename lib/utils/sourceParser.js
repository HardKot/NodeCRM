import { StringUtils } from './stringUtils.js';
import { Types } from './types.js';
class SourceParserError extends Error {}
class SourceParser {
  getSourceType(source) {
    if (Array.isArray(source)) return 'array';
    if (Types.isFunction(source)) return 'function';
    if (Types.isClass(source)) return 'class';
    if (Types.isNull(source)) return 'null';
    return typeof source;
  }
  parse(value, options) {
    const srcType = this.getSourceType(value);
    const methodName = StringUtils.factoryCamelCase(`parse`, srcType);
    const parser = this[methodName];
    if (!parser) throw new SourceParserError('Parser for source type "' + srcType + '" not specified');
    return parser.call(this, value, options);
  }
  parseArray(source, options) {
    throw new SourceParserError('parseArray method not implemented');
  }
  parseFunction(source, options) {
    throw new SourceParserError('parseFunction method not implemented');
  }
  parseClass(source, options) {
    throw new SourceParserError('parseClass method not implemented');
  }
  parseObject(source, options) {
    throw new SourceParserError('parseObject method not implemented');
  }
  parseString(source, options) {
    throw new SourceParserError('parseString method not implemented');
  }
}

export { SourceParser };
export { SourceParserError };
