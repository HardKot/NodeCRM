export abstract class Types {
  private constructor();

  static isObject(source: any): source is object;
  static isFunction(source: any): source is Function;
  static isClass(source: any): source is Function;
  static isUndefined(source: any): source is undefined;
  static isSymbol(source: any): source is symbol;
  static isPrimitive(source: any): source is string | number | boolean | null | undefined | symbol;
  static isNull(source: any): source is null;
  static isString(source: any): source is string;
  static isNumber(source: any): source is number;
  static isInt(source: any): source is number;
  static notNull<T>(source: T | null): source is T;
  static isBoolean(source: any): source is boolean;
  static isWritableStream(source: any): source is NodeJS.WritableStream | import('stream').Writable;
  static isReadableStream(source: any): source is NodeJS.ReadableStream | import('stream').Readable;
  static isAsyncIterable<T>(source: any): source is AsyncIterable<T>;
}
