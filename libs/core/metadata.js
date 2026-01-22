class Metadata {
  #registry = new Map();

  static extractFrom(obj) {
    const metadata = new Metadata();
    const entries = Object.entries(obj).filter(([key, _]) => key.startsWith?.('$'));

    metadata.#registry = new Map(entries);
    Object.freeze(metadata);
    return metadata;
  }

  define(key, value) {
    this.#registry.set(key, value);
  }

  get(key) {
    return this.#registry.get(key);
  }

  has(key) {
    return this.#registry.has(key);
  }
}

export { Metadata };
