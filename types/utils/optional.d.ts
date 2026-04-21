export declare class Optional<T> {
    private value;
    constructor(value: T | null | undefined);
    static of<T>(value: T): Optional<T>;
    static ofNullable<T>(value: T | null | undefined): Optional<T>;
    static empty<T>(): Optional<T>;
    isPresent(): boolean;
    isEmpty(): boolean;
    get(): T;
    orElse(other: T): T;
    orElseGet(supplier: () => T): T;
    getOrNull(): T | null;
    getOrUndefined(): T | undefined;
    orElseThrow(errorSupplier?: () => Error): T;
    ifPresent(consumer: (value: T) => void): void;
    map<U>(mapper: (value: T) => U): Optional<U>;
    filter(predicate: (value: T) => boolean): Optional<T>;
}
