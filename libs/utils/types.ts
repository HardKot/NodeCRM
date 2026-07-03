import * as stream from 'node:stream';
import * as streamWeb from 'node:stream/web';
class TypeError extends Error { }
class Types {
  constructor() {
    throw new Error('Types is a static class and cannot be instantiated');
  }
  static isObject(v: any): v is object {
    return v !== null && typeof v === 'object' && !Array.isArray(v);
  }
  static isRecord<T>(v: any): v is Record<string, T> {
    return typeof v === 'object' && !Array.isArray(v);
  }
  static isFunction(v: any): v is Function {
    if (typeof v !== 'function') return false;
    const str = Function.prototype.toString.call(v);
    return !str.startsWith('class ');
  }
  static isClass<T extends { new(...args: any[]): any }>(v: any): v is T {
    if (typeof v !== 'function') return false;
    const str = Function.prototype.toString.call(v);
    return str.startsWith('class ');
  }
  static isUndefined(v: any): v is undefined {
    return v === undefined;
  }
  static isSymbol(v: any): v is symbol {
    return typeof v === 'symbol';
  }
  static isPrimitive(v: any): v is number | string | boolean | bigint | symbol | undefined {
    return ['number', 'bigint', 'boolean', 'string', 'undefined', 'symbol'].includes(typeof v);
  }
  static isPromise<T>(v: any): v is Promise<T> {
    return v instanceof Promise;
  }
  static isNull(v: any): v is null {
    return v === null;
  }
  static isString(v: any): v is string {
    return typeof v === 'string';
  }
  static isNumber(v: any): v is number {
    return typeof v === 'number' && !Number.isNaN(v);
  }
  static isInt(v: any): v is number {
    return Number.isInteger(v);
  }
  static isEnum<T extends object>(v: any, enums: T): v is keyof T | Pick<T, any> {
    const keys = Object.keys(enums);
    const values = Object.values(enums);

    return values.includes(v) || keys.includes(v);
  }

  static notNull(v: any): v is object {
    if (typeof v === 'object') {
      return v !== null;
    }
    return false;
  }
  static isBoolean(v: any): v is boolean {
    return typeof v === 'boolean';
  }
  static isWritableStream(v: any): v is stream.Writable | streamWeb.WritableStream {
    if (v instanceof stream.Writable) return true;
    if (v instanceof streamWeb.WritableStream) return true;
    return false;
  }
  static isReadableStream(v: any): v is stream.Readable | streamWeb.ReadableStream {
    if (v instanceof stream.Readable) return true;
    if (v instanceof streamWeb.ReadableStream) return true;
    return false;
  }
  static isBinary(v: any): v is Buffer | Blob {
    return Buffer.isBuffer(v) || v instanceof Blob;
  }
  static isAsyncIterator(v: any): v is { [Symbol.asyncIterator]: Function } {
    return !!v && Symbol.asyncIterator in v;
  }

  static isNotInstanceOf<T>(v: any, Class: new (...args: any[]) => T) {
    return !Types.isInstanceOf(v, Class);
  }

  static isInstanceOf<T>(v: any, Class: new (...args: any[]) => T): v is T {
    return v instanceof Class;
  }

  static isAnyInstanceOf<T, TT extends { new(...args: any[]): T }[]>(
    v: any,
    ...classes: TT
  ): v is T {
    return classes.some(cls => v instanceof cls);
  }
}

export { TypeError };
export { Types };
