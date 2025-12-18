import fs from 'node:fs';
import path from 'node:path';
import module from 'node:module';

import { Code } from './code.js';

class Slice {
  #codes = new Map();

  constructor(app, options = {}) {
    this.app = app;
    if (!Array.isArray(options.path)) {
      options.path = [options.path ?? './'];
    }
    this.sliceCtx = options.context;
    this.path = options.path.map(it => path.join(this.app.path, it));
  }

  async load() {
    for (const it of this.path) {
      const stat = fs.statSync(it);
      if (stat.isFile()) {
        this.#codes.main = this.loadCode(it);
      }

      const files = await this.loadFiles(it);

      for (const file of files) {
        this.#codes.set(file, await this.loadCode(path.resolve(file)));
      }
    }

    return this.getModules();
  }

  async loadFiles(parent = './') {
    let results = [];

    for (const content of fs.readdirSync(parent, {
      withFileTypes: true,
    })) {
      if (content.name.startsWith('.') || content.name.startsWith('_')) continue;

      const children = path.join(parent, content.name);

      if (content.isFile() && Code.supportExtension.some(it => children.endsWith(it))) {
        results.push(children);
        continue;
      }
      if (content.isDirectory()) {
        const nestedResults = await this.loadFiles(children);
        results = results.concat(nestedResults);
      }
    }

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
      relative: path.relative(this.app.path, path.dirname(absolutePath)),
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
        if (path.relative(self.app.path, modulePath).startsWith('..')) {
          return originRequire(modulePath);
        }
        return self.loadCode(modulePath)?.exports;
      }

      return originRequire(modulePath);
    }

    return require;
  }

  getModule(modulePath) {
    return this.#codes.get(modulePath);
  }

  getModules() {
    return Object.fromEntries(this.#codes.entries());
  }
}

export { Slice };
