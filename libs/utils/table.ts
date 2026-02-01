export class Table<K, V> extends Map<K, V[]> {
  add(row: K, value: V): void {
    if (!this.has(row)) {
      super.set(row, [value]);
    } else {
      const existing = super.get(row)!;
      existing.push(value);
    }
  }

  get(row: K): V[] {
    if (!this.has(row)) {
      return [];
    }
    return super.get(row)!;
  }
}
