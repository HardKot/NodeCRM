import events from 'node:events';
import path from 'node:path';
import { DiContainerModule } from '../diContainer/diContainerModule.js';
import { SchemaModule } from '../schema/schemaModule.js';

class Application extends events.EventEmitter {
  constructor() {
    super();

    this.path = process.cwd();
    this.diContainer = new DiContainerModule();
    this.schema = new SchemaModule();

    Object.freeze(this);
  }

  resolvePath(...segments) {
    return path.resolve(this.path, ...segments);
  }
}

export { Application };
