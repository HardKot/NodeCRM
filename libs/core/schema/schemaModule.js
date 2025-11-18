import { SchemaParser } from './schemaParser.js';
import { DefaultAdapter } from './defaultAdapter.js';
import { SchemaRegistry } from './schemaRegistry.js';

class SchemaModule {
  #parser;
  #adapter;
  #registry;

  constructor(adapterConstructor = DefaultAdapter) {
    this.#parser = new SchemaParser();
    this.#registry = new SchemaRegistry(this);
    this.#adapter = new adapterConstructor();
  }

  get adapter() {
    return this.#adapter;
  }

  get registry() {
    return this.#registry;
  }

  get parser() {
    return this.#parser;
  }

  get schemas() {
    return this.#registry.schemas;
  }

  get structure() {
    return this.#registry.structure;
  }

  registerSchema(name, value) {
    const structure = this.#parser.parser(value);
    this.#registry.set(name, structure);

    return this;
  }

  unregisterSchema(name) {
    this.#registry.delete(name);

    return this;
  }

  updateSchema(name, value) {
    const structure = this.#parser.parser(value);
    this.#registry.set(name, structure);

    return this;
  }

  createValidator(name) {
    const schema = this.#registry.get(name);
    if (!schema) {
      throw new Error(`Schema "${name}" is not registered`);
    }
    return schema.check.bind(schema);
  }

  createTransformer(name) {
    const schema = this.#registry.get(name);
    if (!schema) {
      throw new Error(`Schema "${name}" is not registered`);
    }
    return schema.transform.bind(schema);
  }
}

export { SchemaModule };
