import * as stream from 'node:stream';
import * as streamWeb from 'node:stream/web';

export class TypeError extends Error {}

export class Types {
  constructor() {
    throw new Error('Types is a static class and cannot be instantiated');
  }

  static isObject(v: any): v is Object {
    return v !== null && typeof v === 'object' && !Array.isArray(v);
  }

  static isRecord<K extends string | number | symbol, V>(v: any): v is Record<K, V> {
    return typeof v === 'object' && !Array.isArray(v);
  }

  static isFunction(v: any): v is Function {
    if (typeof v !== 'function') return false;
    const str = Function.prototype.toString.call(v);
    return !str.startsWith('class ');
  }

  static isClass(v: any): v is new (...args: any[]) => any {
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

  static isPrimitive(v: any): v is string | number | boolean | undefined | symbol | bigint {
    return ['number', 'bigint', 'boolean', 'string', 'undefined', 'symbol'].includes(typeof v);
  }

  static isPromise(v: any): v is Promise<any> {
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

  static notNull<T>(v: T | null): v is T {
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

  static isAsyncIterator(v: any): v is AsyncIterable<any> {
    return !!v && Symbol.asyncIterator in v;
  }
}
