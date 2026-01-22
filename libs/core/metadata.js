import { Types } from '../utils/index.js';

class Metadata {
  #registry = new Map();

  static extractFrom(obj) {
    const keys = ['access', 'body', 'params', 'returns'].concat(
      Object.keys(obj).filter(key => key.startsWith?.('$'))
    );

    const entries = [];

    for (const key of keys) {
      if (key in obj) entries.push([key, obj[key]]);
    }

    return new Metadata(entries);
  }

  constructor(entries = null) {
    if (Types.isObject(entries)) entries = Object.entries(entries);
    this.#registry = new Map(entries);
    Object.freeze(this);
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
