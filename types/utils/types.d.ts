import * as stream from 'node:stream';
import * as streamWeb from 'node:stream/web';
export declare class TypeError extends Error {
}
export declare class Types {
    constructor();
    static isObject(v: any): v is Object;
    static isRecord<K extends string | number | symbol, V>(v: any): v is Record<K, V>;
    static isFunction(v: any): v is Function;
    static isClass(v: any): v is new (...args: any[]) => any;
    static isUndefined(v: any): v is undefined;
    static isSymbol(v: any): v is symbol;
    static isPrimitive(v: any): v is string | number | boolean | undefined | symbol | bigint;
    static isPromise(v: any): v is Promise<any>;
    static isNull(v: any): v is null;
    static isString(v: any): v is string;
    static isNumber(v: any): v is number;
    static isInt(v: any): v is number;
    static notNull<T>(v: T | null): v is T;
    static isBoolean(v: any): v is boolean;
    static isWritableStream(v: any): v is stream.Writable | streamWeb.WritableStream;
    static isReadableStream(v: any): v is stream.Readable | streamWeb.ReadableStream;
    static isBinary(v: any): v is Buffer | Blob;
    static isAsyncIterator(v: any): v is AsyncIterable<any>;
}
