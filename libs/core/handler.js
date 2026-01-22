import { Result, Types, Optional } from '../utils/index.js';
import { Schema } from '../schema/index.js';
import stream from 'node:stream';
import streamWeb from 'node:stream/web';
import { AccessError, factoryAccess, PrivateAccess } from './access.js';
import { Metadata } from './metadata.js';

class ConsumerError extends Error {}

class Handler {
  #runner;
  constructor(runner, metadata = {}) {
    if (!Types.isFunction(runner)) throw new ConsumerError(`Consumer runner must be a function`);
    if (!(metadata instanceof Metadata)) metadata = new Metadata(metadata);
    this.#runner = runner;

    this.access = Optional.ofNullable(metadata.get('access'))
      .map(it => {
        if (Types.isFunction(it)) return it;
        if (Types.isString(it)) return factoryAccess(it);
        return null;
      })
      .orElse(PrivateAccess);

    this.params = Optional.ofNullable(metadata.get('params'))
      .map(it => Schema.parse(it))
      .getOrNull();

    this.body = Optional.ofNullable(metadata.get('body'))
      .map(it => {
        if ([stream.Readable, streamWeb.ReadableStream].includes(it)) return it;
        if (Types.isObject(it)) return Schema.parse(it);
        return null;
      })
      .getOrNull();

    this.returns = Optional.ofNullable(metadata.get('returns'))
      .map(it => {
        if ([stream.Writable, streamWeb.WritableStream].includes(it)) return it;
        if (Types.isObject(it)) return Schema.parse(it);
        return null;
      })
      .getOrNull();

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

      if (this.returns) return Result.success(this.returns.transform(result));
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

export { Handler, ConsumerError };
