import { Types } from './types.js';

const privateConstructor = Symbol();

class Result<T = null> {
  readonly value: T | Error;
  readonly isSuccess: boolean;
  readonly isFailure: boolean;

  static of<U = null, E extends Error = Error>(value: U | E) {
    return new Result<U>(value, true, privateConstructor);
  }
  static success<U = null>(value: U) {
    return new Result<U>(value, true, privateConstructor);
  }
  static failure<U = null, E extends Error = Error>(error: E) {
    return new Result<U>(error, false, privateConstructor);
  }

  static fromPromise<U, E extends Error>(promise: Promise<U>) {
    return promise.then((value) => Result.success<U>(value)).catch((error) => Result.failure<U, E>(error));
  }

  private constructor(value: T | Error, isSuccess: boolean, privateSymbol: symbol) {
    if (privateSymbol === privateConstructor) throw new Error('Result constructor is private');

    this.value = value;
    if (Types.isError(value) || !isSuccess) {
      this.isSuccess = false;
      this.isFailure = true;
    } else {
      this.isFailure = false;
      this.isSuccess = true;
    }

    Object.freeze(this);
  }
  getOrNull() {
    return this.isSuccess ? this.value : null;
  }
  getOrThrow() {
    if (this.isFailure) throw this.value;
    return this.value;
  }
  getOrElse(onFailure: (e: Error) => T) {
    if (Types.isFunction(onFailure) && Types.isError(this.value)) {
      return this.isSuccess ? this.value : onFailure(this.value);
    }
    return this.isSuccess ? this.value : onFailure;
  }
  errorOrNull() {
    return this.isFailure ? this.value : null;
  }
  fold<U>(onSuccess: (value: T) => U, onFailure: (value: Error) => U) {
    if (Types.isError(this.value)) {
      return onFailure(this.value);
    }
    return onSuccess(this.value);
  }

  map<U>(transform: (value: T) => U) {
    if (!Types.isError(this.value)) {
      try {
        const transformed = transform(this.value);
        return Result.success(transformed);
      } catch (e) {
        const error = Types.normolizeError(e);
        return Result.failure(error);
      }
    }
    return Result.failure(this.value);
  }
}

export { Result };
