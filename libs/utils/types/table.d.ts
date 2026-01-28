export class Table<T, R> extends Map<T, R[]> {
  add(row: T, value: R): this;
  get(row: T): R;
}
