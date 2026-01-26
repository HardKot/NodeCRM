class Optional {
  constructor(value) {
    this._value = value;
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
    return this._value !== null && this._value !== undefined;
  }

  isEmpty() {
    return !this.isPresent();
  }

  get() {
    if (!this.isPresent()) {
      throw new Error('No value present');
    }
    return this._value;
  }

  orElse(other) {
    return this.isPresent() ? this._value : other;
  }

  orElseGet(supplier) {
    return this.isPresent() ? this._value : supplier();
  }

  getOrNull() {
    return this.isPresent() ? this._value : null;
  }

  orElseThrow(errorSupplier) {
    if (!this.isPresent()) {
      throw errorSupplier ? errorSupplier() : new Error('No value present');
    }
    return this._value;
  }

  ifPresent(consumer) {
    if (this.isPresent()) {
      consumer(this._value);
    }
  }

  map(mapper) {
    if (!this.isPresent()) {
      return Optional.empty();
    }
    return Optional.ofNullable(mapper(this._value));
  }
}

module.exports = { Optional };
