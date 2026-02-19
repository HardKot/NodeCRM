import { Readable, Writable } from 'node:stream';
import { ReadableStream, WritableStream } from 'node:stream/web';
import * as buffer from 'node:buffer';

import { Result, Types } from '../utils';
import { BaseField, SchemaRegistry } from '../schema';
import { AccessFunction, parserAccess, PrivateAccess, wrapAccessFunction } from '../security/access';
import { Metadata } from '../core';
import { Session } from '../security/session';

class CommandError extends Error {}
class AccessError extends CommandError {}

export type CommandBodyType = typeof Readable | typeof ReadableStream | BaseField | typeof Buffer | typeof buffer.Blob;
export type CommandReturnsType =
  | typeof Writable
  | typeof WritableStream
  | BaseField
  | typeof Buffer
  | typeof buffer.Blob;

type CommandBody = Readable | ReadableStream | Buffer | buffer.Blob | any;
type CommandReturns = Writable | WritableStream | Buffer | buffer.Blob | any;

const CommandMetadata = Object.freeze({
  ParamsSymbol: 'params',
  BodySymbol: 'body',
  ReturnsSymbol: 'returns',
  AccessSymbol: 'access',
});

class Command<T extends Function> {
  public static createFromFunction<T extends Function = any>(
    runner: T,
    metadata: Metadata,
    schemas: SchemaRegistry
  ) {
    return new Command<T>(
      runner,
      metadata,
      this.extractSchemaCommand(CommandMetadata.ParamsSymbol, metadata, schemas),
      this.extractSchemaCommand(CommandMetadata.BodySymbol, metadata, schemas),
      this.extractSchemaCommand(CommandMetadata.ReturnsSymbol, metadata, schemas)
    );
  }

  public static createFromObject<T extends Object>(
    obj: T,
    metadata: Metadata,
    schemas: SchemaRegistry
  ) {
    const commands: [string, Command<any>][] = [];
    let runnerNames = metadata.get<string[]>('runners').orElse(['execute', 'run']);

    for (const runnerName of runnerNames) {
      const runner = obj[runnerName as keyof T];
      if (!Types.isFunction(runner)) continue;
      commands.push([
        runnerName,
        new Command<any>(
          runner,
          metadata.getSubcomponent(runner),
          this.extractSchemaCommand(CommandMetadata.ParamsSymbol, metadata, schemas),
          this.extractSchemaCommand(CommandMetadata.BodySymbol, metadata, schemas),
          this.extractSchemaCommand(CommandMetadata.ReturnsSymbol, metadata, schemas)
        ),
      ]);
    }

    return commands;
  }

  private static extractSchemaCommand(key: string, metadata: Metadata, schemas: SchemaRegistry) {
    const source = metadata.get<any>(key).orElse(null);
    if (!source) return null;

    if ([Readable, ReadableStream, Writable, WritableStream].includes(source)) return source;
    if (source === Buffer || source === buffer.Blob) return source;
    if (source instanceof BaseField) return source;

    return schemas.generateFromSource(source);
  }

  public readonly access: AccessFunction;
  public readonly description?: string;

  constructor(
    private runner: T,
    public metadata: Metadata,
    public readonly params: BaseField | null,
    public readonly body: CommandBodyType | null,
    public readonly returns: CommandReturnsType | null
  ) {
    this.access = metadata
      .get<AccessFunction | Function>(CommandMetadata.AccessSymbol)
      .map(it => {
        if (Types.isFunction(it)) return wrapAccessFunction(it);
        if (Types.isString(it)) return parserAccess(it);
        return PrivateAccess;
      })
      .orElse(PrivateAccess);

    this.description = metadata.get<string>('description').orElse('No description');

    Object.freeze(this);
  }

  async run(bodySource: any, session = new Session(), paramsSource = {}) {
    try {
      const hasAccess = await this.access(session);
      const paramsResult = this.extractValidateParams(paramsSource);
      const bodyResult = this.extractValidateBody(bodySource);

      if (!hasAccess) return Result.failure(new AccessError('Access denied'));
      if (paramsResult.isFailure) return paramsResult;
      if (bodyResult.isFailure) return bodyResult;

      const params = paramsResult.getOrNull();
      const body = bodyResult.getOrNull();

      const resultSource = await this.runner({ body, params, session });

      return this.extractValidateReturns(resultSource);
    } catch (e) {
      if (e instanceof Error) {
        return Result.failure(e);
      }

      return Result.failure(new CommandError(`Consumer execution failed: ${e}`));
    }
  }

  private extractValidateBody(bodySource: any) {
    if (!this.body) return Result.success(null);
    if (this.isReadableClass(this.body)) {
      if (Types.isReadableStream(bodySource)) return Result.success(bodySource);
      return Result.failure(new CommandError('Invalid body stream'));
    }
    if (this.isBaseField(this.body)) return this.body.parse(bodySource);
    return Result.success(null);
  }
  private extractValidateParams(params: any) {
    if (!this.params) return Result.success(null);
    return this.params.parse(params);
  }
  private extractValidateReturns(returns: any) {
    if (!this.returns) return Result.success(null);
    if (this.isWritableClass(this.returns)) {
      if (Types.isWritableStream(returns)) return Result.success(returns);
      return Result.failure(new CommandError('Invalid return stream'));
    }
    if (this.isBaseField(this.returns)) {
      if (this.returns.validate(returns)) return Result.success(returns);
      return Result.failure(new CommandError('Invalid return data'));
    }
    return Result.success(null);
  }

  private isReadableClass(obj: any): obj is typeof Readable | typeof ReadableStream {
    return obj === Readable || obj === ReadableStream;
  }
  private isWritableClass(obj: any): obj is typeof Writable | typeof WritableStream {
    return obj === Writable || obj === WritableStream;
  }
  private isBaseField(obj: any): obj is BaseField {
    return obj instanceof BaseField;
  }
}

export { Command, CommandError, AccessError, CommandMetadata, CommandBody, CommandReturns };
