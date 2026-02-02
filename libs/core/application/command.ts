import { Readable, Writable } from 'node:stream';
import { ReadableStream, WritableStream } from 'node:stream/web';

import { ObjectUtils, Result, Types } from '../../utils';
import { BaseField, SchemaRegistry } from '../schema';
import { parserAccess, PrivateAccess, AccessFunction } from './access';
import { Metadata } from '../metadata';
import { Session } from './session';

class CommandError extends Error {}
class AccessError extends CommandError {}

type CommandBody = typeof Readable | typeof ReadableStream | BaseField;
type CommandReturns = typeof Writable | typeof WritableStream | BaseField;

class Command<T extends Function> {
  static ParamsSymbol = Symbol('command:params');
  static BodySymbol = Symbol('command:body');
  static ReturnsSymbol = Symbol('command:returns');

  public static createFromFunction<T extends Function = any>(
    runner: T,
    metadata: Metadata,
    schemas: SchemaRegistry
  ) {
    return new Command<T>(runner, metadata, schemas);
  }

  public static createFromObject<T extends Object>(
    obj: T,
    metadata: Metadata,
    schemas: SchemaRegistry
  ) {
    const commands: [string, Command<any>][] = [];
    let runnerNames = metadata.get<string[]>('runners').orElse([]);

    if (!runnerNames.length) runnerNames = ObjectUtils.getMethodNames(obj);
    const systemMethods = [
      'isPrototypeOf',
      'propertyIsEnumerable',
      'toString',
      'valueOf',
      'toLocaleString',
      'hasOwnProperty',
    ];

    for (const runnerName of runnerNames) {
      if (runnerName.startsWith('_')) continue;
      const runner = obj[runnerName as keyof T];
      if (!Types.isFunction(runner)) continue;
      if (systemMethods.includes(runnerName)) continue;
      commands.push([
        runnerName,
        new Command<any>(runner, metadata.getSubcomponent(runner), schemas),
      ]);
    }

    return commands;
  }

  public readonly access: AccessFunction;
  public readonly params: BaseField | null;
  public readonly body: CommandBody | null;
  public readonly returns: CommandReturns | null;

  constructor(
    private runner: T,
    private metadata: Metadata,
    private schemas: SchemaRegistry
  ) {
    this.access = metadata
      .get<AccessFunction>('access')
      .map(it => {
        if (Types.isFunction(it)) return it;
        if (Types.isString(it)) return parserAccess(it);
        return PrivateAccess;
      })
      .orElse(PrivateAccess);

    const extractFromSchema = (key: symbol) => {
      const schema = this.schemas.get(key).getOrNull();
      if (schema) return schema;
      return this.metadata.get<BaseField>(key).getOrNull();
    };

    this.params = extractFromSchema(Command.ParamsSymbol);
    this.body = extractFromSchema(Command.BodySymbol);
    this.returns = extractFromSchema(Command.ReturnsSymbol);

    Object.freeze(this);
  }

  async run(bodySource: any, session = new Session(), paramsSource: any = null) {
    try {
      const hasAccess = await this.access(session);
      const paramsResult = this.extractValidateParams(paramsSource);
      const bodyResult = this.extractValidateBody(bodySource);

      if (!hasAccess) return Result.failure(new AccessError('Access denied'));
      if (paramsResult.isFailure) return paramsResult;
      if (bodyResult.isFailure) return bodyResult;

      const params = paramsResult.getOrNull();
      const body = bodyResult.getOrNull();

      const result = await this.runner({ body, params, session });

      if (this.isWritableClass(this.returns)) {
        if (Types.isWritableStream(result)) return Result.success(result);
        return Result.failure(new CommandError('Invalid return stream'));
      }

      if (this.returns) return this.returns.validate(result);
      return Result.success(null);
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

export { Command, CommandError };
