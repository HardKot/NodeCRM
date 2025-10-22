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
    return this;
  }

  static TYPE = Object.freeze({
    COMMONJS: Symbol(),
    ESM: Symbol(),
    TS: Symbol(),
  });

  static detectType(ext) {
    if (ext === '.ts') return CrmModule.TYPE.TS;
    if (ext === '.mjs') return CrmModule.TYPE.ESM;
    if (ext === '.cjs') return CrmModule.TYPE.COMMONJS;
    return CrmModule.TYPE.COMMONJS;
  }
}
