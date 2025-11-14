class Schema {
  constructor(structure, adapter) {
    for (const field in structure) {
      this[field] = adapter.parser(structure[field]);
    }
  }
}

export { Schema };
