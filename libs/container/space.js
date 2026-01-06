import fs from 'node:fs';
import fsp from 'node:fs/promises';
import events from 'node:events';
import path from 'node:path';
import module from 'node:module';

import { Code } from './code';

class Space {
  constructor(config) {
    this.codes = new Map();

    this.logger = config.logger ?? console;
    this.eventEmitter = new events.EventEmitter();

    if (!this.path) {
      this.path = process.cwd();
    } else if (path.isAbsolute(config.path)) {
      this.path = config.path;
    } else {
      this.path = path.join(process.cwd(), config.path);
    }
    this.path = config.path ?? process.cwd();

    this.watchTimeout = config.watchTimeout ?? 500;
    this.codeContext = config.context ?? {};

    Object.freeze(this);
  }

  get modules() {
    const entries = Array.from(this.codes.entries())
      .filter(([_, code]) => code.name.endsWith('.module.js'))
      .map(([_, code]) => [code.name.replace('.module.js', ''), code.exports]);
    const modules = Object.fromEntries(entries);
    Object.freeze(modules);
    return modules;
  }

  async load() {
    const { logger } = this;

    try {
      this.eventEmitter.emit('preLoad', this);
      logger.info(`Load space from path '${this.path}'`);
      this.codes.clear();

      const files = await this.#loadFiles();

      files.filter(file => file.endsWith('.module.js')).forEach(file => this.#loadCode(file));

      logger.info(`Success load space from path '${this.path}'`);
      this.eventEmitter.emit('postLoad', this);
    } catch (e) {
      logger.info(`Failed load space from path '${this.path}'`);
      this.eventEmitter.emit('error', e);
    }
  }

  async watch() {
    const { logger } = this;
    let timeoutId = null;

    const watcher = fsp.watch(this.path, { recursive: true });

    for await (const _ of watcher) {
      clearTimeout(timeoutId);

      timeoutId = setTimeout(async () => {
        try {
          logger.info(`Changes detected in space '${this.path}'. Reloading...`);
          await this.load();
          logger.info(`Success '${this.path}' reloaded.`);
        } catch (e) {
          logger.error(`Space '${this.path}' failed reload`);
          this.eventEmitter.emit('error', e);
        }
      }, timeoutId);
    }
  }

  onPreLoad(listener) {
    this.eventEmitter.on('preLoad', listener);
  }

  onPostLoad(listener) {
    this.eventEmitter.on('postLoad', listener);
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
    if (this.codes.has(absolutePath)) {
      return this.codes.get(absolutePath);
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
    this.codes.set(absolutePath, code);
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
