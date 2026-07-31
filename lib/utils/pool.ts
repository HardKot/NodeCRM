export { Pool };

interface PoolProps {
  size: number;
}

class Pool<T> {
  #pool: T[] = [];
  #size: number;

  constructor({ size }: PoolProps) {
    this.#size = size;
    this.#pool = new Array(size).fill(null).map(() => ({}) as T);
  }

  isFull() {
    return this.#pool.length >= this.#size;
  }
}
