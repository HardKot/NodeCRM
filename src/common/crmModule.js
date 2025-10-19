import path from 'node:path';
import fs from 'fs';

const ts = await import('typescript').catch(() => null);

export class CrmModuleError extends Error { }

export class CrmModule {
  constructor(module, options = {}) {
    const ext = path.extname(module).toLowerCase();
    this.type = CrmModule.detectType(ext);

    this.name = options.name || path.basename(module, ext);

    this.dirname = options.dirname || process.cwd();
    this.relative = options.relativePath || '.';
    this.path = path.isAbsolute(module) ? module : path.join(this.dirname, this.relative, module);

    this.exports = {};
  }

  isExists() {
    return fs.existsSync(this.path);
  }

  async load() {
    if (!this.isExists()) throw new CrmModuleError(`File ${this.path} doesn't exist`);
    this.exports = await import(this.path);

    Object.freeze(this);
    Object.freeze(this.exports);
    return this;
  }

  static detectType(ext) {
    if (ext === '.ts') return CrmModule.TYPE.TS;
    if (ext === '.mjs') return CrmModule.TYPE.ESM;
    if (ext === '.cjs') return CrmModule.TYPE.COMMONJS;
    return CrmModule.TYPE.COMMONJS;
  }
}
