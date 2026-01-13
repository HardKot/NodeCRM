import fs from 'node:fs';
import fsp from 'node:fs/promises';
import events from 'node:events';
import path from 'node:path';
import module from 'node:module';

import { Code } from './code';

class Space {
  static async load(config = {}) {
    const space = new Space({ path: config.path, context: config.context });
    await space.#load();
    return space;
  }

  static async watch(config = {}) {
    const space = new Space({
      path: config.path,
      context: config.context,
      watchTimeout: config.watchTimeout,
    });
    await space.#load();
    space.#watch();
    return space;
  }

  #eventEmitter = new events.EventEmitter();
  #abortController = new AbortController();
  #codes = new Map();
  #modules = {};

  constructor(config = {}) {
    if (!config.path) {
      this.path = process.cwd();
    } else if (path.isAbsolute(config.path)) {
      this.path = config.path;
    } else {
      this.path = path.join(process.cwd(), config.path);
    }

    this.watchTimeout = config.watchTimeout ?? 500;
    this.codeContext = config.context ?? {};

    Object.freeze(this.#modules);
    Object.freeze(this);
  }

  getAll() {
    return this.#modules;
  }

  get(name) {
    return this.#modules[name];
  }

  stop() {
    this.#abortController.abort();
  }

  onChange(listener) {
    return this.#eventEmitter.on('update', listener);
  }
  onDelete(listener) {
    return this.#eventEmitter.on('delete', listener);
  }
  onError(error) {
    return this.#eventEmitter.on('error', error);
  }
  onAfter(listener) {
    return this.#eventEmitter.on('postLoad', listener);
  }
  onBefore(listener) {
    return this.#eventEmitter.on('preLoad', listener);
  }

  async #load() {
    this.#eventEmitter.emit('preLoad');

    const files = await this.#loadFiles();
    const modules = [];

    for (const file of files) {
      if (!file.endsWith('.module.js')) continue;
      const module = this.#loadCode(file);
      modules.push([module.name.replace('.module.js', ''), await module.exports]);
    }

    this.#modules = Object.fromEntries(modules);

    this.#eventEmitter.emit('postLoad');
  }

  async #watch() {
    let timeoutId = null;

    const watcher = fsp.watch(this.path, {
      recursive: true,
      signal: this.#abortController.signal,
      encoding: 'utf-8',
      persistent: false,
    });

    for await (const _ of watcher) {
      clearTimeout(timeoutId);

      timeoutId = setTimeout(async () => {
        try {
          this.#codes.clear();
          await this.#load();
          this.#eventEmitter.emit('update', this);
        } catch (e) {
          this.#eventEmitter.emit('error', e);
        }
      }, timeoutId);
    }
  }

  async #loadFiles() {
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

    return results;
  }

  #loadCode(absolutePath) {
    if (this.#codes.has(absolutePath)) {
      return this.#codes.get(absolutePath);
    }
    if (!fs.existsSync(absolutePath)) {
      return null;
    }
    const source = fs.readFileSync(absolutePath, 'utf-8');
    let name = path.basename(absolutePath);

    if (name === 'index') name = path.dirname(absolutePath);

    const code = new Code(source, {
      name: name,
      dirname: path.dirname(absolutePath),
      createRequire: this.#createRequire.bind(this),
      context: this.codeContext,
    });
    code.autoLoad();
    this.#codes.set(absolutePath, code);
    return code;
  }

  #createRequire(relativePath) {
    const originRequire = module.createRequire(relativePath);
    const self = this;

    function require(modulePath) {
      if (path.isAbsolute(modulePath)) {
        if (path.relative(self.path, modulePath).startsWith('..')) {
          return originRequire(modulePath);
        }
        return self.#loadCode(modulePath)?.exports;
      }

      return originRequire(modulePath);
    }

    return require;
  }
}

export { Space };
