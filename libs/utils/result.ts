import { Types } from './types';

export class Result<T, E = Error> {
  private readonly value: T | E;
  readonly isSuccess: boolean;
  readonly isFailure: boolean;

  static of<T>(value: T): Result<T> {
    return new Result<T, Error>(value, true);
  }

  static success<T, E = Error>(value: T): Result<T, E> {
    return new Result<T, E>(value, true);
  }

  static failure<T, E = Error>(error: E): Result<T, E> {
    return new Result<T, E>(error, false);
  }

  static fromPromise<T, E = Error>(promise: Promise<T>): Promise<Result<T, E>> {
    return promise
      .then(value => Result.success<T, E>(value))
      .catch(error => Result.failure<T, E>(error as E));
  }

  constructor(value: T | E, isSuccess: boolean | null = null) {
    this.value = value;

    if (Types.isBoolean(isSuccess)) {
      this.isSuccess = isSuccess;
      this.isFailure = !isSuccess;
    } else {
      this.isFailure = value instanceof Error;
      this.isSuccess = !this.isFailure;
    }

    Object.freeze(this);
  }

  getOrNull(): T | null {
    return this.isSuccess ? (this.value as T) : null;
  }

  getOrThrow(): T {
    if (this.isFailure) throw this.value;
    return this.value as T;
  }

  getOrElse(onFailure: ((error: E) => T) | T): T {
    if (Types.isFunction(onFailure)) {
      return this.isSuccess ? (this.value as T) : (onFailure as (error: E) => T)(this.value as E);
    }
    return this.isSuccess ? (this.value as T) : (onFailure as T);
  }

  errorOrNull(): E | null {
    return this.isFailure ? (this.value as E) : null;
  }

  fold<U>(onSuccess: (value: T) => U, onFailure: (error: E) => U): U {
    if (this.isSuccess) {
      return onSuccess(this.value as T);
    }
    return onFailure(this.value as E);
  }

  map<U>(transform: (value: T) => U): Result<U, E> {
    if (this.isSuccess) {
      try {
        const transformed = transform(this.value as T);
        return Result.success<U>(transformed) as Result<U, E>;
      } catch (error) {
        return Result.failure<U, E>(error as E);
      }
    }
    return Result.failure<U, E>(this.value as E);
  }
}
