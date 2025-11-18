import { SchemaParser } from './schemaParser.js';
import { DefaultAdapter } from './defaultAdapter.js';
import { SchemaRegistry } from './schemaRegistry.js';

class SchemaModule {
  #parser;
  #adapter;
  #registry;

  constructor(adapterConstructor = DefaultAdapter) {
    this.#parser = new SchemaParser(this);
    this.#registry = new SchemaRegistry(this);
    this.#adapter = new adapterConstructor(this);
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

  validateValue(name, value) {
    const schema = this.#registry.get(name);
    return schema.check(value);
  }

  transformValue(name, value) {
    const schema = this.#registry.get(name);
    return schema.transform(value);
  }

  get schemas() {
    return Array.from(this.#registry.schemas);
  }

  get structure() {
    return Array.from(this.#registry.structure);
  }
}

export { SchemaModule };
