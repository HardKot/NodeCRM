class Table extends Map {
  add(row, value) {
    if (!this.has(row)) {
      super.set(row, [value]);
    } else {
      const existing = super.get(row);
      existing.push(value);
    }
  }

  get(row) {
    if (!this.has(row)) {
      return [];
    }
    return super.get(row);
  }
}

module.exports = { Table };
