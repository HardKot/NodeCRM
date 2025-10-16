import { EventEmitter } from 'node:events';

import { Api } from '../api/api.js';
import fs from 'fs';
import fsp from 'node:fs/promises';
import { CrmStatic } from './crmStatic.js';
import path from 'node:path';
import { DependenciesInjection } from '../di/dependenciesInjection.js';
import { Security } from '../security/security.js';
import { Storage } from '../storage/storage.js';
import { Config } from '../config/config.js';

export class Application extends EventEmitter {
  constructor() {
    super();

    this.name = 'Application';
    this.version = '0.0.1';
    this.description = 'A basic application structure';

    this.path = process.cwd();
    this.sourcePath = path.join(this.path, 'app');

    this.modules = [];
    this.config = {};

    this.logger = null;
    this.database = null;
    this.cache = null;

    this.config = new Config(this);
    this.storage = new Storage(this);
    this.filters = new Security(this);
    this.api = new Api(this);
    this.di = new DependenciesInjection(this);
  }

  async load() {
    this.modules = await this.loadModule();
    Object.freeze(this.modules);

    await this.config.load();
    await this.storage.load();
    await this.filters.load();
    await this.di.load();
    await this.api.load();
  }

  async loadModule(targetPath = this.sourcePath) {
    const isExists = fs.existsSync(targetPath);
    if (!isExists) throw new Error(`Path ${targetPath} does not exist`);

    const stats = await fsp.stat(targetPath);

    if (stats.isFile()) return [new CrmStatic(targetPath)];

    if (stats.isDirectory()) {
      const files = fs.readdirSync(targetPath, { withFileTypes: true });
      const modules = [];

      for (const file of files) {
        if (file.isFile()) {
          const fullPath = path.join(targetPath, file.name);

          modules.push(new CrmStatic(fullPath));
        }

        if (file.isDirectory()) {
          const subDirPath = path.join(targetPath, file.name);
          const subModules = await this.loadModule(subDirPath);
          modules.push(...subModules);
        }
      }

      return modules;
    }

    return [];
  }
}
