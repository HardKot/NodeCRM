import * as stream from 'node:stream';
import * as streamWeb from 'node:stream/web';

export { Types };

type EnumFunction<T extends string, U = number> = ((value: U) => T | null) & Readonly<{ [key in T]: U }>;

class Types {
  constructor() {
    throw new Error('Types is a static class and cannot be instantiated');
  }
  static isObject(v: unknown): v is object {
    return v !== null && typeof v === 'object' && !Array.isArray(v);
  }
  static isRecord<T>(v: unknown, fn?: (it: unknown) => it is T): v is Record<string, T> {
    if (typeof v !== 'object' || Array.isArray(v) || v === null) return false;
    if (!fn) return true;
    return Object.values(v).some((it) => !fn(it));
  }
  static isFunction(v: unknown): v is Function {
    if (typeof v !== 'function') return false;
    const str = Function.prototype.toString.call(v);
    return !str.startsWith('class ');
  }
  static isClass<T extends { new(...args: any[]): any }>(v: unknown): v is T {
    if (typeof v !== 'function') return false;
    const str = Function.prototype.toString.call(v);
    return str.startsWith('class ');
  }
  static isUndefined(v: unknown): v is undefined {
    return typeof v === 'undefined';
  }

  static isNotUndefined<T = unknown>(v: T | unknown): v is T {
    return !Types.isUndefined(v);
  }

  static isSymbol(v: unknown): v is symbol {
    return typeof v === 'symbol';
  }
  static isPrimitive(v: unknown): v is number | string | boolean | bigint | symbol | undefined {
    return ['number', 'bigint', 'boolean', 'string', 'undefined', 'symbol'].includes(typeof v);
  }
  static isPromise<T>(v: unknown): v is Promise<T> {
    return v instanceof Promise;
  }
  static isNull(v: unknown): v is null {
    return v === null;
  }
  static isString(v: unknown): v is string {
    return typeof v === 'string';
  }
  static isNumber(v: unknown): v is number {
    return typeof v === 'number' && !Number.isNaN(v);
  }
  static isInt(v: unknown): v is number {
    return Number.isInteger(v);
  }

  static isArray<T>(v: unknown, fn?: (it: unknown) => it is T): v is Array<T> {
    if (!fn) return Array.isArray(v);
    return Array.isArray(v) && v.some((it) => !fn(it));
  }

  static notNull<T extends object>(v: null | T): v is T {
    if (typeof v === 'object') {
      return v !== null;
    }
    return false;
  }
  static isBoolean(v: unknown): v is boolean {
    return typeof v === 'boolean';
  }
  static isWritableStream(v: unknown): v is stream.Writable | streamWeb.WritableStream {
    if (v instanceof stream.Writable) return true;
    if (v instanceof streamWeb.WritableStream) return true;
    return false;
  }
  static isReadableStream(v: any): v is stream.Readable | streamWeb.ReadableStream {
    if (v instanceof stream.Readable) return true;
    if (v instanceof streamWeb.ReadableStream) return true;
    return false;
  }
  static isBinary(v: unknown): v is Buffer | Blob {
    return Buffer.isBuffer(v) || v instanceof Blob;
  }
  static isAsyncIterator(v: unknown): v is { [Symbol.asyncIterator]: Function } {
    return Types.isObject(v) && Symbol.asyncIterator in v;
  }

  static isNotInstanceOf<T, U extends new (...args: any[]) => any>(
    v: T,
    Class: U
  ): v is T & Exclude<T, InstanceType<U>> {
    return !Types.isInstanceOf(v, Class);
  }

  static isError(value: unknown): value is Error {
    return value instanceof Error;
  }

  static isInstanceOf<T extends new (...args: any[]) => any>(v: unknown, Class: T): v is InstanceType<T> {
    return v instanceof Class;
  }

  static isAnyInstanceOf<T, TT extends { new(...args: any[]): T }[]>(v: unknown, ...classes: TT): v is T {
    return classes.some((cls) => v instanceof cls);
  }

  static normolizeError(v: unknown, DefaultClass?: { new(...args: any[]): Error }) {
    if (v instanceof Error) return v;
    return new (DefaultClass ?? Error)(`${v}`);
  }

  static isIn<T extends object>(value: unknown, obj: T): value is keyof T {
    return this.isString(value) && value in obj;
  }

  static enum<T extends string, U = number>(obj: readonly T[] | Record<T, U>): EnumFunction<T, U> {
    const simpleEntriesEnum: [T, U][] = Array.isArray(obj)
      ? obj.map((it, index) => [it, index] as [T, U])
      : (Object.entries(obj) as [T, U][]);

    const enumDict = Object.fromEntries(simpleEntriesEnum) as Record<string, U>;
    const enumReverseDict = Object.fromEntries(simpleEntriesEnum.map(([k, v]) => [v, k])) as Record<string, T>;

    const enumFn = (value: U): T | null => enumReverseDict[String(value)] ?? null;

    for (const [key, value] of Object.entries(enumDict)) {
      (enumFn as any as Record<string, unknown>)[key] = value;
    }

    Object.freeze(enumFn);

    return enumFn as EnumFunction<T, U>;
  }

  static isPrototypeOf<T extends object>(v: unknown, Class: { prototype: T }): boolean {
    return Types.isObject(v) && Object.getPrototypeOf(v) === Class.prototype;
  }

  static isNotImplementedError<T>(): T {
    throw new Error('Method not implemented');
  }

  static normolizeReadableStream<T extends stream.Readable | streamWeb.ReadableStream>(v: T): stream.Readable {
    if (v instanceof stream.Readable) return v;
    if (v instanceof streamWeb.ReadableStream) return stream.Readable.fromWeb(v);
    throw new Error('Invalid stream type');
  }

  static normolizeWritableStream<T extends stream.Writable | streamWeb.WritableStream>(v: T): stream.Writable {
    if (v instanceof stream.Writable) return v;
    if (v instanceof streamWeb.WritableStream) return stream.Writable.fromWeb(v);
    throw new Error('Invalid stream type');
  }
}
