class Schema {
  #definition;

  constructor(name, definition) {
    this.name = name;
    this.#definition = definition;
  }

  updateDefinition(definition) {
    this.#definition = definition;
    return this;
  }

  validate(data) {
    return this.#definition.check.bind(this.#definition)(data);
  }

  transform(data) {
    return this.#definition.transform.bind(this.#definition)(data);
  }
}

export { Schema };
