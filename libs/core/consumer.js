import { Result, Types } from '../utils/index.js';
import { Schema } from '../schema/index.js';
import stream from 'node:stream';
import streamWeb from 'node:stream/web';
import { AccessError, factoryAccess, PrivateAccess } from './access.js';

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
      this.access = factoryAccess(this.access);
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
      this.returns = metadata.body;
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

      const paramsIsValid = this.params.validate(params);
      const bodyIsValid = this.body ? this.body.validate(body) : true;
    } catch (e) {
      if (e instanceof Error) {
        return Result.failure(e);
      }

      return Result.failure(new ConsumerError(`Consumer execution failed: ${e}`));
    }
  }
}
