import * as Types from './types.js';
import NullPointError from './nullPointError.js';

export class Optional {
  static #EMPTY = new Optional(null);

  #value;

  constructor(value) {
    this.#value = value;
  }

  get() {
    if (Types.isNull(this.#value)) {
      throw new NullPointError('No value present');
    }

    return this.#value;
  }

  orElse(value) {
    if (this.#value === null) return value;
    return this.#value;
  }

  isPresent() {
    return this.#value !== null;
  }

  isEmpty() {
    return this.#value === null;
  }

  ifPresent(action) {
    if (this.#value === null) {
      action(this.#value);
    }
  }

  ifPresentOrElse(action, emptyAction) {
    if (this.#value === null) {
      action(this.#value);
    } else {
      emptyAction();
    }
  }

  filter(action) {
    if (this.#value && !action(this.#value)) {
      this.#value = null;
    }

    return this;
  }

  map(action) {
    if (this.#value) {
      this.#value = action(this.#value);
    }

    return this;
  }

  static of(value) {
    if (value === null) {
      throw new NullPointError(`Value is null: ${value}`);
    }
    return new Optional(value);
  }

  static ofNullable(value) {
    if (value === null) {
      return Optional.#EMPTY;
    }

    return new Optional(value);
  }
}
