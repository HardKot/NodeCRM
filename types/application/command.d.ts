import { Readable, Writable } from 'node:stream';
import { ReadableStream, WritableStream } from 'node:stream/web';
import * as buffer from 'node:buffer';
import { BaseField, SchemaRegistry } from '../schema';
import { AccessFunction } from '../security/access';
import { Metadata } from '../core';
import { Session } from '../security/session';
declare class CommandError extends Error {
}
declare class AccessError extends CommandError {
}
export type CommandBodyType = typeof Readable | typeof ReadableStream | BaseField | typeof Buffer | typeof buffer.Blob;
export type CommandReturnsType = typeof Writable | typeof WritableStream | BaseField | typeof Buffer | typeof buffer.Blob;
type CommandBody = Readable | ReadableStream | Buffer | buffer.Blob | any;
type CommandReturns = Writable | WritableStream | Buffer | buffer.Blob | any;
declare const CommandMetadata: any;
declare class Command<T extends Function> {
    private runner;
    metadata: Metadata;
    readonly params: BaseField | null;
    readonly body: CommandBodyType | null;
    readonly returns: CommandReturnsType | null;
    static createFromFunction<T extends Function = any>(runner: T, metadata: Metadata, schemas: SchemaRegistry): Command<T>;
    static createFromObject<T extends Object>(obj: T, metadata: Metadata, schemas: SchemaRegistry): {};
    private static extractSchemaCommand;
    readonly access: AccessFunction;
    readonly description?: string;
    constructor(runner: T, metadata: Metadata, params: BaseField | null, body: CommandBodyType | null, returns: CommandReturnsType | null);
    run(bodySource: any, session?: Session, paramsSource?: {}): unknown;
    private extractValidateBody;
    private extractValidateParams;
    private extractValidateReturns;
    private isReadableClass;
    private isWritableClass;
    private isBaseField;
}
export { Command, CommandError, AccessError, CommandMetadata, CommandBody, CommandReturns };
