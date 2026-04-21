import { Readable, Writable } from 'node:stream';
import { ReadableStream, WritableStream } from 'node:stream/web';
import * as buffer from 'node:buffer';
import { Result, Types } from '../utils';
import { BaseField } from '../schema';
import { parserAccess, PrivateAccess, wrapAccessFunction } from '../security/access';
import { Session } from '../security/session';
class CommandError extends Error {
}
class AccessError extends CommandError {
}
const CommandMetadata = Object.freeze({
    ParamsSymbol: 'params',
    BodySymbol: 'body',
    ReturnsSymbol: 'returns',
    AccessSymbol: 'access',
});
class Command {
    runner;
    metadata;
    params;
    body;
    returns;
    static createFromFunction(runner, metadata, schemas) {
        return new Command(runner, metadata, this.extractSchemaCommand(CommandMetadata.ParamsSymbol, metadata, schemas), this.extractSchemaCommand(CommandMetadata.BodySymbol, metadata, schemas), this.extractSchemaCommand(CommandMetadata.ReturnsSymbol, metadata, schemas));
    }
    static createFromObject(obj, metadata, schemas) {
        const commands = [];
        let runnerNames = metadata.get('runners').orElse(['execute', 'run']);
        for (const runnerName of runnerNames) {
            const runner = obj[runnerName];
            if (!Types.isFunction(runner))
                continue;
            commands.push([
                runnerName,
                new Command(runner, metadata.getSubcomponent(runner), this.extractSchemaCommand(CommandMetadata.ParamsSymbol, metadata, schemas), this.extractSchemaCommand(CommandMetadata.BodySymbol, metadata, schemas), this.extractSchemaCommand(CommandMetadata.ReturnsSymbol, metadata, schemas)),
            ]);
        }
        return commands;
    }
    static extractSchemaCommand(key, metadata, schemas) {
        const source = metadata.get(key).orElse(null);
        if (!source)
            return null;
        if ([Readable, ReadableStream, Writable, WritableStream].includes(source))
            return source;
        if (source === Buffer || source === buffer.Blob)
            return source;
        if (source instanceof BaseField)
            return source;
        return schemas.generateFromSource(source);
    }
    access;
    description;
    constructor(runner, metadata, params, body, returns) {
        this.runner = runner;
        this.metadata = metadata;
        this.params = params;
        this.body = body;
        this.returns = returns;
        this.access = metadata
            .get(CommandMetadata.AccessSymbol)
            .map(it => {
            if (Types.isFunction(it))
                return wrapAccessFunction(it);
            if (Types.isString(it))
                return parserAccess(it);
            return PrivateAccess;
        })
            .orElse(PrivateAccess);
        this.description = metadata.get('description').orElse('No description');
        Object.freeze(this);
    }
    async run(bodySource, session = new Session(), paramsSource = {}) {
        try {
            const hasAccess = await this.access(session);
            const paramsResult = this.extractValidateParams(paramsSource);
            const bodyResult = this.extractValidateBody(bodySource);
            if (!hasAccess)
                return Result.failure(new AccessError('Access denied'));
            if (paramsResult.isFailure)
                return paramsResult;
            if (bodyResult.isFailure)
                return bodyResult;
            const params = paramsResult.getOrNull();
            const body = bodyResult.getOrNull();
            const resultSource = await this.runner({ body, params, session });
            return this.extractValidateReturns(resultSource);
        }
        catch (e) {
            if (e instanceof Error) {
                return Result.failure(e);
            }
            return Result.failure(new CommandError(`Consumer execution failed: ${e}`));
        }
    }
    extractValidateBody(bodySource) {
        if (!this.body)
            return Result.success(null);
        if (this.isReadableClass(this.body)) {
            if (Types.isReadableStream(bodySource))
                return Result.success(bodySource);
            return Result.failure(new CommandError('Invalid body stream'));
        }
        if (this.isBaseField(this.body))
            return this.body.parse(bodySource);
        return Result.success(null);
    }
    extractValidateParams(params) {
        if (!this.params)
            return Result.success(null);
        return this.params.parse(params);
    }
    extractValidateReturns(returns) {
        if (!this.returns)
            return Result.success(null);
        if (this.isWritableClass(this.returns)) {
            if (Types.isWritableStream(returns))
                return Result.success(returns);
            return Result.failure(new CommandError('Invalid return stream'));
        }
        if (this.isBaseField(this.returns)) {
            if (this.returns.validate(returns))
                return Result.success(returns);
            return Result.failure(new CommandError('Invalid return data'));
        }
        return Result.success(null);
    }
    isReadableClass(obj) {
        return obj === Readable || obj === ReadableStream;
    }
    isWritableClass(obj) {
        return obj === Writable || obj === WritableStream;
    }
    isBaseField(obj) {
        return obj instanceof BaseField;
    }
}
export { Command, CommandError, AccessError, CommandMetadata };
