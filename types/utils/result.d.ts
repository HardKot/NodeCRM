export declare class Result<T, E = Error> {
    private readonly value;
    readonly isSuccess: boolean;
    readonly isFailure: boolean;
    static of<T>(value: T): Result<T>;
    static success<T, E = Error>(value: T): Result<T, E>;
    static failure<T, E = Error>(error: E): Result<T, E>;
    static fromPromise<T, E = Error>(promise: Promise<T>): Promise<Result<T, E>>;
    constructor(value: T | E, isSuccess?: boolean | null);
    getOrNull(): T | null;
    getOrThrow(): T;
    getOrElse(onFailure: ((error: E) => T) | T): T;
    errorOrNull(): E | null;
    fold<U>(onSuccess: (value: T) => U, onFailure: (error: E) => U): U;
    map<U>(transform: (value: T) => U): Result<U, E>;
}
