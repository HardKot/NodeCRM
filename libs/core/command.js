const stream = require('node:stream');
const streamWeb = require('node:stream/web');

const { Result, Types } = require('../utils/types/objectUtils');
const { Schema } = require('./schema');
const { AccessError, factoryAccess, PrivateAccess } = require('./access.js');
const { Metadata } = require('./metadata.js');

class CommandError extends Error {}

class Command {
  #runner;

  constructor(runner, metadata = {}) {
    if (!Types.isFunction(runner)) throw new CommandError(`Consumer runner must be a function`);
    if (!(metadata instanceof Metadata)) metadata = new Metadata(metadata);
    this.meta = metadata;
    this.#runner = runner;

    this.access = this.meta
      .get('access')
      .map(it => {
        if (Types.isFunction(it)) return it;
        if (Types.isString(it)) return factoryAccess(it);
        return null;
      })
      .orElse(PrivateAccess);

    this.params = this.meta
      .get('params')
      .map(it => Schema.parse(it))
      .getOrNull();

    this.body = this.meta
      .get('body')
      .map(it => {
        if ([stream.Readable, streamWeb.ReadableStream].includes(it)) return it;
        if (Types.isObject(it)) return Schema.parse(it);
        return null;
      })
      .getOrNull();

    this.returns = this.meta
      .get('returns')
      .map(it => {
        if ([stream.Writable, streamWeb.WritableStream].includes(it)) return it;
        if (Types.isObject(it)) return Schema.parse(it);
        return null;
      })
      .getOrNull();

    Object.freeze(this);
  }

  async run(body, session = new Map(), params = {}) {
    try {
      const hasAccess = await this.access(session);
      if (!hasAccess) return Result.failure(new AccessError('Access denied'));

      if (!this.params) params = {};
      const validateParams = this.params?.validate(params);
      if (validateParams?.isFailure) return validateParams;

      if (!this.body) body = null;
      if (this.bodyIsStream() && !Types.isReadableStream(body))
        return Result.failure(new CommandError('Invalid body stream'));

      const bodyValidate = this.body?.validate(body);
      if (bodyValidate?.isFailure) return bodyValidate;

      const result = await this.#runner({ body, params, session });

      if (this.returnsIsStream()) {
        if (Types.isWritableStream(result)) {
          return Result.success(result);
        }
        return Result.failure(new CommandError('Invalid return stream'));
      }

      if (this.returns) return Result.success(this.returns.transform(result));
      return Result.success();
    } catch (e) {
      if (e instanceof Error) {
        return Result.failure(e);
      }

      return Result.failure(new CommandError(`Consumer execution failed: ${e}`));
    }
  }

  bodyIsStream() {
    return this.body === stream.Readable || this.body === streamWeb.ReadableStream;
  }

  returnsIsStream() {
    return this.returns === stream.Writable || this.returns === streamWeb.WritableStream;
  }
}

module.exports = { Command, CommandError };
