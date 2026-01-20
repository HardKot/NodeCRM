const { Result, Types } = require('../utils/index.js');
const { Schema } = require('../schema/index.js');
const stream = require('node:stream');
const streamWeb = require('node:stream/web');
const { AccessError, factoryAccess, PrivateAccess } = require('./access.js');

class ConsumerError extends Error {}

class Consumer {
  #runner;

  constructor(runner, metadata) {
    if (!Types.isFunction(runner)) throw new ConsumerError(`Consumer runner must be a function`);
    this.#runner = runner;

    this.params = metadata.params && Schema.parse(metadata.params);

    if (Types.isFunction(metadata.access)) {
      this.access = metadata.access;
    } else if (Types.isString(metadata.access)) {
      this.access = factoryAccess(metadata.access);
    } else {
      this.access = PrivateAccess;
    }

    if ([stream.Readable, streamWeb.ReadableStream].includes(metadata.body)) {
      this.body = metadata.body;
    } else if (Types.isObject(metadata.body)) {
      this.body = Schema.parse(metadata.body);
    } else {
      this.body = null;
    }

    if ([stream.Writable, streamWeb.WritableStream].includes(metadata.returns)) {
      this.returns = metadata.returns;
    } else if (Types.isObject(metadata.returns)) {
      this.returns = Schema.parse(metadata.returns);
    } else if (Types.isString(metadata.returns)) {
      this.returns = metadata.returns;
    } else {
      this.returns = null;
    }

    Object.freeze(this);
  }

  async run(body, user = null, params = {}) {
    try {
      const hasAccess = await this.access(user);
      if (!hasAccess) return Result.failure(new AccessError('Access denied'));

      if (!this.params) params = {};
      const validateParams = this.params?.check(params);
      if (validateParams?.isFailure)
        return Result.failure(validateParams.getOrElse(new ConsumerError('Invalid params')));

      if (!this.body) body = null;
      if (this.bodyIsStream() && !Types.isReadableStream(body))
        return Result.failure(new ConsumerError('Invalid body stream'));
      const bodyValidate = this.body?.check(body);
      if (bodyValidate?.isFailure)
        return Result.failure(bodyValidate.getOrElse(new ConsumerError('Invalid body')));

      const result = await this.#runner({ body, params, user });

      if (this.returnsIsStream()) {
        if (Types.isWritableStream(result)) {
          return Result.success(result);
        }
        return Result.failure(new ConsumerError('Invalid return stream'));
      }

      if (this.body) return Result.success(this.body.transform(result));
      return Result.success();
    } catch (e) {
      if (e instanceof Error) {
        return Result.failure(e);
      }

      return Result.failure(new ConsumerError(`Consumer execution failed: ${e}`));
    }
  }

  bodyIsStream() {
    return this.body === stream.Readable || this.body === streamWeb.ReadableStream;
  }

  returnsIsStream() {
    return this.returns === stream.Writable || this.returns === streamWeb.WritableStream;
  }
}

module.exports = { Consumer, ConsumerError };
