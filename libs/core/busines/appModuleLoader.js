import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import module from 'node:module';

import { AppModule, AppModuleError } from './appModule';

class AppModuleLoader {
  constructor(app) {
    this.modules = {};
    this.app = app;
  }

  async execute() {
    const { app } = this;

    if (!fs.existsSync(this.app.path)) throw new AppModuleError(`Path ${app.path} does not exist`);

    const stats = await fsp.stat(app.path);
    if (!stats.isDirectory()) throw new AppModuleError(`Path ${app.path} is not a directory`);

    await this.#loadModules();

    return this;
  }

  async #loadModules() {
    const options = {
      dirname: this.app.path,
      relativePath: '.',
      createRequire: this.#createRequire.bind(this),
      createImport: this.#createImport.bind(this),
    };

    const files = await this.#recursiveReadDir(this.app.path);
    const modules = files
      .filter(it => this.#isScriptFile(it))
      .map(it => new AppModule(it, options));

    this.modules = Object.fromEntries(modules.map(it => [it.name, it]));

    await Promise.all(modules.map(it => it.loadSource()));
    return this.modules;
  }

  #createRequire(baseDir, relativePath) {
    const internalRequire = module.createRequire(path.join(baseDir, relativePath));
    const packageJSON = module.findPackageJSON(this.app.path);

    function require(name) {
      if (!name) throw new Error('Module name is required');
    }

    return require;
  }
  #createImport(baseDir, relativePath) {}

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

  #isScriptFile(uri) {
    return ['.js', '.mjs', '.ts', '.cjs'].includes(path.extname(uri));
  }
}

export { AppModuleLoader };
