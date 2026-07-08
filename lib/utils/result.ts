import { Types } from './types.js';

const privateConstructor = Symbol();

class ResultError extends Error {}

class Result<T = null> implements IResult<T> {
  readonly value: T | Error;

  static of<U = null, E extends Error = Error>(value: U | E) {
    return new Result<U>(value, privateConstructor);
  }
  static success<U = null>(value: U) {
    if (Types.isError(value)) throw new ResultError(`Value is Error!`);
    return new Result<U>(value, privateConstructor);
  }
  static failure<U = null, E extends Error = Error>(error: E | unknown) {
    return new Result<U>(Types.normolizeError(error), privateConstructor);
  }

  static fromPromise<U, E extends Error>(promise: Promise<U>) {
    return promise.then((value) => Result.success<U>(value)).catch((error) => Result.failure<U, E>(error));
  }

  private constructor(value: T | Error, privateSymbol: symbol) {
    if (privateSymbol === privateConstructor) throw new ResultError('Result constructor is private');

    this.value = value;

    Object.freeze(this);
  }

  get isSuccess() {
    return !Types.isError(this.value);
  }

  get isFailure() {
    return Types.isError(this.value);
  }

  getOrNull(): T | null {
    return Types.isError(this.value) ? null : this.value;
  }

  getOrThrow(): T {
    if (Types.isError(this.value)) throw this.value;
    return this.value;
  }

  getOrElse(onFailure: (e: Error) => T): T {
    if (Types.isFunction(onFailure)) {
      return Types.isError(this.value) ? onFailure(this.value) : this.value;
    }
    return Types.isError(this.value) ? onFailure : this.value;
  }

  errorOrNull(): Error | null {
    return Types.isError(this.value) ? this.value : null;
  }

  fold<U>(onSuccess: (value: T) => U, onFailure: (value: Error) => U): U {
    if (Types.isError(this.value)) {
      return onFailure(this.value);
    }
    return onSuccess(this.value);
  }

  map<U>(transform: (value: T) => U): Result<U> {
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
