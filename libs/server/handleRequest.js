import * as querystring from 'node:querystring';
import stream from 'node:stream';
import streamWeb from 'node:stream/web';

import { Field, Schema } from '../schema/index.js';

class HandleRequest {
  #consumer;

  constructor(consumer, metadata) {
    this.#consumer = consumer;

    this.mapping = metadata.mapping;
    if (this.mapping.endsWith('/')) this.mapping += 'index';
    this.httpMethod = metadata.method ?? 'get';

    this.produces = metadata.produces ?? 'application/json';
    this.paramsSchema = this.#getSchema(metadata.params);
    this.bodySchema = this.#getSchema(metadata.body);
    this.status = metadata.status ?? 200;

    Object.freeze(this);
  }

  async run(req, res) {}

  async getBody(req) {
    if (!this.bodySchema) return null;
    if (this.bodySchema === stream.Readable) {
      const readStream = new stream.Readable();
      req.pipe(readStream);
      return readStream;
    }
    if (this.bodySchema === streamWeb.ReadableStream) {
      return stream.Readable.toWeb(this.bodySchema);
    }

    if (req.method.toLowerCase() === 'get') return null;

    const raw = await new Promise((resolve, reject) => {
      const body = [];
      req.on('data', chunk => body.push(chunk));
      req.on('end', () => resolve(Buffer.concat(body).toString()));
      req.on('error', err => reject(err));
    });

    if (raw.includes('__proto__') || raw.includes('constructor')) return null;

    return this.bodySchema.parse(raw);
  }

  getParams(url) {
    if (!this.paramsSchema) return null;

    const [pathName, search = ''] = url.split('?');
    const urlParams = this.#getPathParams(pathName);
    const searchParams = this.#getSearchParams(search);

    const paramsEntries = [].concat(urlParams, searchParams);
    const paramsObj = Object.fromEntries(paramsEntries);

    return this.paramsSchema.transform(paramsObj);
  }

  #getSearchParams(searchPrams) {
    return Object.entries(querystring.parse(searchPrams));
  }

  #getPathParams(url) {
    const parts = url.split('/').filter(it => it);
    const mappingParts = this.mapping.split('/').filter(it => it);
    const paramsEntries = [];

    for (let i = 0; i < mappingParts.length; i++) {
      const mp = mappingParts[i];
      if (mp.startsWith(':')) {
        const paramName = mp.slice(1);
        paramsEntries.push([paramName, parts[i]]);
      }
    }
    return paramsEntries;
  }

  #getSchema(v) {
    if (!v) return null;
    if (v instanceof Field.Schema || v instanceof Schema) return v;
    if (Object.getPrototypeOf(v) === Object.prototype) return Schema.parse(v);
    return v;
  }
}

export { HandleRequest };
