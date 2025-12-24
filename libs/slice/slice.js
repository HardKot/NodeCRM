import fs from 'node:fs';
import path from 'node:path';
import module from 'node:module';

import { Code } from './code.js';
import fsp from 'node:fs/promises';

class Slice {
  #codes = new Map();

  constructor(options = {}) {
    this.sliceCtx = options.context;
    this.name = options.name ?? 'default';
    this.appPath = options.appPath ?? process.cwd();
    this.path = path.join(options.appPath, options.path ?? './');
    this.logger = options.logger ?? console;

    this.files = [];
    this.modules = [];
  }

  async load() {
    this.#codes.clear();
    await this.loadFiles(this.path);
    await this.loadModules(this.path);

    return this.modules;
  }

  async loadModules() {
    const modules = this.files
      .filter(file => file.endsWith('.module.js'))
      .map(file => this.loadCode(file));

    Object.freeze(modules);
    this.modules = modules;

    return this.modules;
  }

  async loadFiles() {
    const results = [];
    const dirs = [this.path];

    for (const dir of dirs) {
      const contents = await fsp.readdir(dir, { withFileTypes: true });

      for (const content of contents) {
        if (content.name.startsWith('.') || content.name.startsWith('_')) continue;
        const children = path.join(dir, content.name);
        if (content.isDirectory()) {
          dirs.push(children);
        } else if (content.isFile() && Code.supportExtension.some(it => children.endsWith(it))) {
          results.push(children);
        }
      }
    }

    Object.freeze(results);
    this.files = results;

    return results;
  }

  loadCode(absolutePath) {
    if (this.#codes.has(absolutePath)) {
      return this.#codes.get(absolutePath);
    }
    if (!fs.existsSync(absolutePath)) {
      return null;
    }
    const source = fs.readFileSync(absolutePath, 'utf-8');
    const code = new Code(source, {
      name: path.basename(absolutePath),
      dirname: path.dirname(absolutePath),
      relative: path.relative(this.appPath, path.dirname(absolutePath)),
      createRequire: this.createRequire.bind(this),
      context: this.sliceCtx,
    });
    code.autoLoad();
    this.#codes.set(absolutePath, code);
    return code;
  }

  createRequire(relativePath) {
    const originRequire = module.createRequire(relativePath);
    const self = this;
    function require(modulePath) {
      if (path.isAbsolute(modulePath)) {
        if (path.relative(self.appPath, modulePath).startsWith('..')) {
          return originRequire(modulePath);
        }
        return self.loadCode(modulePath)?.exports;
      }

      return originRequire(modulePath);
    }

    return require;
  }
}

export { Slice };
