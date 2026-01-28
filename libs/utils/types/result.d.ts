export class Result<T, E> {
  static of<T, E>(value: T): Result<T, E>;
  static success<T, E>(value: T): Result<T, E>;
  static failure<T, E>(error: E): Result<T, E>;

  getOrNull(): T | null;
  getOrThrow(): T;
  getOrElse(onFailure: T): T;
  getOrElse(onFailure: (error: E) => T): T;
  errorOrNull(): E | null;
  fold<TT>(onSuccess: (value: T) => TT, onFailure: (error: E) => TT): TT;

  map<U>(transform: (value: T) => U): Result<U, E>;
}
