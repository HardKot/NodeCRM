class Optional {
  #value;

  constructor(value) {
    this.#value = value;
  }

  static of(value) {
    if (value === null || value === undefined) {
      throw new Error('Value cannot be null or undefined');
    }
    return new Optional(value);
  }

  static ofNullable(value) {
    return new Optional(value);
  }

  static empty() {
    return new Optional(null);
  }

  isPresent() {
    return this.#value !== null && this.#value !== undefined;
  }

  isEmpty() {
    return !this.isPresent();
  }

  get() {
    if (!this.isPresent()) {
      throw new Error('No value present');
    }
    return this.#value;
  }

  orElse(other) {
    return this.isPresent() ? this.#value : other;
  }

  orElseGet(supplier) {
    return this.isPresent() ? this.#value : supplier();
  }

  getOrNull() {
    return this.isPresent() ? this.#value : null;
  }

  orElseThrow(errorSupplier) {
    if (!this.isPresent()) {
      throw errorSupplier ? errorSupplier() : new Error('No value present');
    }
    return this.#value;
  }

  ifPresent(consumer) {
    if (this.isPresent()) {
      consumer(this.#value);
    }
  }

  map(mapper) {
    if (!this.isPresent()) {
      return Optional.empty();
    }
    return Optional.ofNullable(mapper(this.#value));
  }
}

module.exports = { Optional };
