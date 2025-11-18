class SchemaRegistry {
  #module;
  #schemas = new Map();
  #structure = new Map();

  constructor(module) {
    this.#module = module;
  }

  get schemas() {
    return Array.from(this.#schemas);
  }

  get structure() {
    return Array.from(this.#structure);
  }

  set(name, structure) {
    this.#structure.set(name, structure);
    return this;
  }

  delete(name) {
    this.#schemas.delete(name);
    this.#structure.delete(name);
    return this;
  }

  get(name) {
    let schema = this.#schemas.get(name);

    if (!schema) {
      const structure = this.#structure.get(name);
      if (!structure) {
        throw new Error(`Schema "${name}" is not registered`);
      }

      schema = this.#module.adapter.factoryType(structure);
      this.#schemas.set(name, schema);
    }

    return schema;
  }
}

export { SchemaRegistry };
