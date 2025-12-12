import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import module from 'node:module';

import { Code } from './code.js';
import { CodeStorage } from './codeStorage.js';

class Slice {
  constructor(app, name, options = {}) {
    this.name = name;
    this.app = app;
    this.codes = {};

    Object.freeze(this);
  }

  async load() {
    const files = await this.loadFiles(this.app.path);

    for (const file of files) {
      const code = this.loadCode(path.resolve(file));
      if (code) {
        this.codes[file] = code;
      }
    }

    return this.codes;
  }

  async loadFiles(parent = './') {
    let results = [];

    for (const content of await fsp.readdir(parent, {
      withFileTypes: true,
    })) {
      const children = path.join(parent, content.name);

      if (content.isFile() && content.name.endsWith(`${this.name}.js`)) {
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
    if (CodeStorage.has(absolutePath)) {
      return CodeStorage.get(absolutePath).exports;
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
    });
    code.autoLoad();
    CodeStorage.set(absolutePath, code);
    return code.exports;
  }

  createRequire(relativePath) {
    const originRequire = module.createRequire(relativePath);
    const self = this;
    function require(modulePath) {
      if (path.isAbsolute(modulePath)) {
        if (path.relative(modulePath, this.app.path).startsWith('..')) {
          return originRequire(modulePath);
        }
        return self.loadCode(modulePath);
      }

      return originRequire(modulePath);
    }

    return require;
  }
}

export { Slice };
