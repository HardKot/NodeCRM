import events from 'node:events';
import path from 'node:path';
import { Transform } from './transformUtils.js';

class SchemaRegistry extends events.EventEmitter {
  #schemas = new Map();
  #structures = new Map();

  constructor(app) {
    super();

    this.app = app;
    this.userSchemaPath = path.join(this.app.src, 'schemas');
    this.adapter = app.adapters.get('schemas');
    Object.freeze(this);
  }

  async load() {
    const schemas = await this.app.readModule(this.userSchemaPath);

    for (const modulePath of schemas) {
      const module = await import(modulePath);
      const name = path.basename(modulePath);

      const structure = module.structure;

      if (!name || !structure) continue;
      this.#structures.set(name, structure);
    }
  }

  #build(structure) {
    const schemaFields = [];

    for (const field in structure) {
      if (typeof structure[field] === 'string') {
        const subSchema = this.get(structure[field]);
        schemaFields.push([field, subSchema]);
        continue;
      }

      const { type, options } = structure[field];
      schemaFields.push([field, this.#buildField(type, options)]);
    }

    const schema = Object.fromEntries(schemaFields);

    return this.adapter.wrapObject(schema);
  }

  #buildField(type, options) {
    if (type === undefined) {
      const objectOptions = options.object;
      const enumOptions = options.enum;
      const arrayOptions = options.array;
      const setOptions = options.set;
      const mapOptions = options.map;
      const tupleOptions = options.tuple;
    }

    return this.adapter.get(type, options);
  }
}

export { SchemaRegistry };
