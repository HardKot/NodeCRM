import path from 'node:path';
import fs from 'node:fs';

class AppModuleError extends Error {}

class AppModule {
  constructor(name, options = {}) {
    this.name = name;

    this.dirname = options.dirname || process.cwd();
    this.relative = options.relativePath || '.';
    this.path = path.join(this.dirname, this.relative, name);

    this.exports = {};
  }

  isExists() {
    return fs.existsSync(this.path);
  }

  async load() {
    if (!this.isExists()) throw new AppModuleError(`Module ${this.name}, not found`);
    this.exports = await import(this.path);

    return this.exports;
  }
}

export { AppModule, AppModuleError };
