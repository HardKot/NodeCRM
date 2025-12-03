import { SchemaField } from './field.js';

class Schema {
  constructor(name, definition) {
    this.name = name;
    this.definition = definition;
  }

  validate(data) {
    return this.definition.check.bind(this.definition)(data);
  }

  transform(data) {
    return this.definition.transform.bind(this.definition)(data);
  }

  from(data) {
    if (!(this.definition instanceof SchemaField))
      throw new Error('SchemaField must be a SchemaField');

    return this.definition.from.bind(this.definition)(data);
  }
}

export { Schema };
