import { SchemaParser } from './schemaParser.js';
import { DefaultAdapter } from './defaultAdapter.js';
import { Schema } from './schema.js';
import { AbstractField } from './field.js';

class SchemaModule {
  #parser = new SchemaParser();
  #registry = new Map();
  #adapter;

  constructor(adapterConstructor = DefaultAdapter) {
    this.#adapter = new adapterConstructor();
  }

  get adapter() {
    return this.#adapter;
  }

  get parser() {
    return this.#parser;
  }

  get schemas() {
    return this.#registry.schemas;
  }

  registerSchema(name, value) {
    const schema = this.factorySchema(value, name);
    this.#registry.set(schema.name, schema);

    return schema;
  }

  updateSchema(name, value) {
    const schema = this.factorySchema(value, name);
    this.#registry.set(schema.name, schema);

    return schema;
  }

  unregisterSchema(name) {
    this.#registry.delete(name);

    return this;
  }

  getSchema(name) {
    return this.#registry.get(name) ?? null;
  }

  factorySchema(value, name = '') {
    if (!name) name = `schema_${Math.round(Math.random() * 10_000)}`;

    if (!(value instanceof Schema) && !(value instanceof AbstractField)) {
      value = this.#parser.parser(value);
      value = this.#adapter.factoryType(value);
    }
    if (value instanceof AbstractField) {
      value = new Schema(name, value);
    }
    return value;
  }
}

export { SchemaModule };
