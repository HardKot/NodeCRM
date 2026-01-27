const { Types } = require('./types.js');

class Result {
  #value = null;

  static of(value) {
    return new Result(value);
  }

  static success(value) {
    return new Result(value, true);
  }

  static failure(error) {
    return new Result(error, false);
  }

  constructor(value, isSuccess = null) {
    this.#value = value;

    if (Types.isBoolean(isSuccess)) {
      this.isSuccess = isSuccess;
      this.isFailure = !isSuccess;
    } else {
      this.isFailure = Error.isError(value);
      this.isSuccess = !this.isFailure;
    }

    Object.freeze(this);
  }

  getOrNull() {
    return this.isSuccess ? this.#value : null;
  }

  getOrThrow() {
    if (this.isFailure) throw this.#value;
    return this.#value;
  }

  getOrElse(onFailure) {
    if (Types.isFunction(onFailure)) {
      return this.isSuccess ? this.#value : onFailure(this.#value);
    }
    return this.isSuccess ? this.#value : onFailure;
  }

  errorOrNull() {
    return this.isFailure ? this.#value : null;
  }

  fold(onSuccess, onFailure) {
    if (this.isSuccess) {
      return onSuccess(this.#value);
    }
    return onFailure(this.#value);
  }

  map(transform) {
    if (this.isSuccess) {
      try {
        return new Result(transform(this.#value));
      } catch (error) {
        return new Result(error);
      }
    }
    return this;
  }
}

module.exports = { Result };
