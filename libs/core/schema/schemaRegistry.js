import events from 'node:events';
import path from 'node:path';
import { Transform } from './transformUtils.js';

class SchemaRegistry extends events.EventEmitter {
  #schemas = new Map();
  #structures = new Map();

  constructor(app) {
    super();

    this.app = app;
    this.adapter = app.adapters.get('schemas');
    Object.freeze(this);
  }

  async load() {
    const schemas = await this.app.readModule('');

    for (const modulePath of schemas) {
      const module = await import(modulePath);
      const name = path.basename(modulePath);

      const structure = module.structure;

      if (!name || !structure) continue;
      this.#structures.set(name, structure);
    }
  }
}

export { SchemaRegistry };
