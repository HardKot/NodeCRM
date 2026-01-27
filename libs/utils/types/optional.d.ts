export class Optional<T> {
  static of<T>(value: T): Optional<T>;
  static empty<T>(): Optional<T>;
  static ofNullable<T>(value: T | null | undefined): Optional<T>;

  constructor(readonly value: T);
  isPresent(): boolean;
  isEmpty(): boolean;

  get(): T;
  getOrNull(): T | null;

  orElse(other: T): T;
  orElseGet(supplier: () => T): T;
  orElseThrow<E extends Error>(errorSupplier: () => E): T;

  ifPresent(consumer: (value: T) => void): void;
  map<U>(mapper: (value: T) => U): Optional<U>;
}
