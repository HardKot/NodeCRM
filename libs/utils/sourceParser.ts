import { StringUtils } from './stringUtils';
import { Types } from './types';

class SourceParserError extends Error {}

abstract class SourceParser<T = void, Options = unknown> {
  public getSourceType(source: any) {
    if (Array.isArray(source)) return 'array';
    if (Types.isFunction(source)) return 'function';
    if (Types.isClass(source)) return 'class';
    if (Types.isNull(source)) return 'null';
    return typeof source;
  }

  public parse(value: any, options?: Options): T {
    const srcType = this.getSourceType(value);
    const methodName = StringUtils.factoryCamelCase(`parse`, srcType) as keyof SourceParser;
    const parser = this[methodName] as (source: any, options?: Options) => T;
    if (!parser)
      throw new SourceParserError('Parser for source type "' + srcType + '" not specified');
    return parser.call(this, value, options);
  }

  protected parseArray(source: unknown[], options?: Options): T {
    throw new SourceParserError('parseArray method not implemented');
  }
  protected parseFunction(source: Function, options?: Options): T {
    throw new SourceParserError('parseFunction method not implemented');
  }
  protected parseClass(source: new (...args: unknown[]) => unknown, options?: Options): T {
    throw new SourceParserError('parseClass method not implemented');
  }
  protected parseObject(source: object, options?: Options): T {
    throw new SourceParserError('parseObject method not implemented');
  }
  protected parseString(source: string, options?: Options): T {
    throw new SourceParserError('parseString method not implemented');
  }
}

export { SourceParser, SourceParserError };
