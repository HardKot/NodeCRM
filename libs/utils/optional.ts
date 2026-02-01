export class Optional<T> {
  private value: T | null | undefined;

  constructor(value: T | null | undefined) {
    this.value = value;
  }

  static of<T>(value: T): Optional<T> {
    if (value === null || value === undefined) {
      throw new Error('Value cannot be null or undefined');
    }
    return new Optional(value);
  }

  static ofNullable<T>(value: T | null | undefined): Optional<T> {
    return new Optional(value);
  }

  static empty<T>(): Optional<T> {
    return new Optional<T>(null);
  }

  isPresent(): boolean {
    return this.value !== null && this.value !== undefined;
  }

  isEmpty(): boolean {
    return !this.isPresent();
  }

  get(): T {
    if (!this.isPresent()) {
      throw new Error('No value present');
    }
    return this.value as T;
  }

  orElse(other: T): T {
    return this.isPresent() ? (this.value as T) : other;
  }

  orElseGet(supplier: () => T): T {
    return this.isPresent() ? (this.value as T) : supplier();
  }

  getOrNull(): T | null {
    return this.isPresent() ? (this.value as T) : null;
  }

  orElseThrow(errorSupplier?: () => Error): T {
    if (!this.isPresent()) {
      throw errorSupplier ? errorSupplier() : new Error('No value present');
    }
    return this.value as T;
  }

  ifPresent(consumer: (value: T) => void): void {
    if (this.isPresent()) {
      consumer(this.value as T);
    }
  }

  map<U>(mapper: (value: T) => U): Optional<U> {
    if (!this.isPresent()) {
      return Optional.empty<U>();
    }
    return Optional.ofNullable(mapper(this.value as T));
  }
}
