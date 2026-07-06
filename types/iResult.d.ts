declare interface IResult<T> {
  readonly value: T | Error;
  readonly isSuccess: boolean;
  readonly isFailure: boolean;

  getOrNull(): T | null;
  getOrThrow(): T;
  getOrElse(onFailure: (e: Error) => T): T;

  errorOrNull(): Error | null;
  fold<U>(onSuccess: (value: T) => U, onFailure: (value: Error) => U): U;

  map<U>(transform: (value: T) => U): ThisType<U>;
}
