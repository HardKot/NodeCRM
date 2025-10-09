import { MODULE_TYPES } from '../common/Module.js';

export class Schema {
  constructor(schema, options = {}) {
    this.schema = schema;
    this.name = schema.__name;

    this.proto = options.proto || schema.__proto || {};
    this.table = options.table || schema.__table || this.name;
    this.primaryKey = options.primaryKey || schema.__primaryKey || 'id';
    this.indexes = options.indexes || schema.__indexes || [];
  }
}
