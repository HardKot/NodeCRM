import fs from 'node:fs';
import path from 'node:path';
import module from 'node:module';

import { Code } from './code.js';

class Slice {
  constructor(app, options = {}) {
    this.app = app;
    this.slicePath = options.slicePath ?? './';
    this.codes = {};

    Object.freeze(this);
  }

  async load() {
    const files = await this.loadFiles(path.join(this.app.path, this.slicePath));

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

    for (const content of fs.readdirSync(parent, {
      withFileTypes: true,
    })) {
      const children = path.join(parent, content.name);

      if (content.isFile() && /.*\.(ts|cjs|mjs|tsx|jsx|js)/.test(content.name)) {
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
    if (this.codes[absolutePath]) {
      return this.codes[absolutePath];
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
    this.codes[absolutePath] = code;
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
}

export { Slice };
