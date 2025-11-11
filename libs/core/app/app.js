import events from 'node:events';

import { DiContainer } from '../dependencyContainer';
import { AppModuleLoader } from '../busines';
import { MetadataRegistry } from '../metadata';
import { SchemaRegistry } from '../schema/index.js';
import fsp from 'node:fs/promises';
import path from 'node:path';
import fs from 'node:fs';

class App extends events.EventEmitter {
  constructor() {
    super();
    this.diContainer = new DiContainer(this);
    this.metadataRegistry = new MetadataRegistry(this);
    this.appModuleLoader = new AppModuleLoader(this);
    this.schemas = new SchemaRegistry(this);
  }

  async load() {}

  async readModule(scope) {
    try {
      if (!fs.existsSync(scope)) return [];

      const modules = await fsp.readdir(scope, {
        recursive: true,
        withFileTypes: true,
      });

      return modules
        .filter(it => it.isFile())
        .map(it => it.name)
        .filter(it => !it.includes(`test${path.sep}`))
        .filter(it => it.endsWith('.js') || it.endsWith('.mjs') || it.endsWith('.cjs'));
    } catch (e) {
      this.logger.error(e);
      return [];
    }
  }
}
