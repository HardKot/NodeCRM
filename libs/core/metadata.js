import { Optional, Types } from '../utils/index.js';

class Metadata {
  #registry = new Map();

  static extractFrom(obj) {
    const entries = ['access', 'body', 'params', 'returns']
      .filter(it => obj[it])
      .map(it => [it, obj[it]]);

    for (const key in obj) {
      if (!key?.startsWith?.('$')) continue;
      entries.push([key.replace('$', ''), obj[key]]);
    }

    return new Metadata(entries);
  }

  constructor(entries = null) {
    if (Types.isObject(entries)) entries = Object.entries(entries);
    this.#registry = new Map(entries);
    Object.freeze(this);
  }

  get(key) {
    return Optional.ofNullable(this.#registry.get(key));
  }

  has(key) {
    return this.#registry.has(key);
  }
}

export { Metadata };
