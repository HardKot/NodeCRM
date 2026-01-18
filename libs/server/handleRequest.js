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

  #getSchema(v) {
    if (!v) return null;
    if (v instanceof Field.Schema || v instanceof Schema) return v;
    if (Object.getPrototypeOf(v) === Object.prototype) return Schema.parse(v);
    return v;
  }

  async run(req, res) {}
}

export { HandleRequest };
