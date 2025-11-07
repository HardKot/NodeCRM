import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path, { dirname } from 'node:path';

import { Result } from '#lib/utils';

import { AppModule, AppModuleError } from './appModule';

class AppModuleLoader {
  constructor(app) {
    this.modules = {};
    this.app = app;
  }

  async loadModules() {
    const { app } = this;

    if (!fs.existsSync(this.app.path)) throw new AppModuleError(`Path ${app.path} does not exist`);

    const stats = await fsp.stat(app.path);
    if (!stats.isDirectory()) throw new AppModuleError(`Path ${app.path} is not a directory`);

    this.modules = Result.of()
      .map(it => [it])
      .toObject()
      .get();

    for (const file of this.#recursiveReadDir(app.path)) {
      if (!this.isScriptFile(it)) continue;

      this.modules[file] = new AppModule(file, this, { dirname: app.path });
      this.modules[file].loadSource();
    }

    Object.freeze(this.modules);

    return this;
  }

  async #recursiveReadDir(targetPath) {
    const isExists = fs.existsSync(targetPath);
    if (!isExists) return [];

    const stats = fs.statSync(targetPath);
    if (stats.isFile()) return [targetPath];
    const allFiles = [];

    if (!stats.isDirectory()) return allFiles;

    const files = await fsp.readdir(targetPath, { withFileTypes: true });

    for (const file of files) {
      if (file.name.startsWith('.') || file.name.startsWith('_')) continue;
      const fullPath = path.join(targetPath, file.name);
      if (file.isFile()) allFiles.push(fullPath);

      if (file.isDirectory()) {
        const subFiles = await this.#recursiveReadDir(fullPath);
        allFiles.push(...subFiles);
      }
    }

    return allFiles;
  }

  isScriptFile(uri) {
    return ['.js', '.mjs', '.ts', '.cjs'].includes(path.extname(uri));
  }
}

export { AppModuleLoader };
