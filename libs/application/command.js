const { Readable, Writable } = require('node:stream');
const { ReadableStream, WritableStream } = require('node:stream/web');
const buffer = require('node:buffer');
const { Result, Types } = require('../utils');
const { BaseField } = require('../schema');
const { parserAccess, PrivateAccess, wrapAccessFunction } = require('../security/access');
const { Session } = require('../security/session');
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
function getMeta(metadata, key, defaultValue = undefined) {
    if (!metadata)
        return defaultValue;
    const value = metadata[key];
    return typeof value === 'undefined' ? defaultValue : value;
}
function getMetaSubcomponent(metadata, subKey) {
    if (!metadata)
        return undefined;
    if (typeof subKey === 'string' || typeof subKey === 'symbol')
        return metadata[subKey];
    if (typeof subKey === 'function')
        return metadata[subKey.name] ?? metadata[subKey.name.toString()];
    return undefined;
}
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
        let runnerNames = getMeta(metadata, 'runners', ['execute', 'run']);
        for (const runnerName of runnerNames) {
            const runner = obj[runnerName];
            if (!Types.isFunction(runner))
                continue;
            commands.push([
                runnerName,
                new Command(runner, getMetaSubcomponent(metadata, runnerName), this.extractSchemaCommand(CommandMetadata.ParamsSymbol, metadata, schemas), this.extractSchemaCommand(CommandMetadata.BodySymbol, metadata, schemas), this.extractSchemaCommand(CommandMetadata.ReturnsSymbol, metadata, schemas)),
            ]);
        }
        return commands;
    }
    static extractSchemaCommand(key, metadata, schemas) {
        const source = getMeta(metadata, key, null);
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
        const access = getMeta(metadata, CommandMetadata.AccessSymbol, null);
        if (Types.isFunction(access)) {
            this.access = wrapAccessFunction(access);
        }
        else if (Types.isString(access)) {
            this.access = parserAccess(access);
        }
        else {
            this.access = PrivateAccess;
        }
        this.description = getMeta(metadata, 'description', 'No description');
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

exports.Command = Command;
exports.CommandError = CommandError;
exports.AccessError = AccessError;
exports.CommandMetadata = CommandMetadata;