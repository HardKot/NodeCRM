import path from 'node:path';
import fs from 'node:fs';
import vm from 'node:vm';
import { NodeContext } from './runTimeContext';

class AppModuleError extends Error { }

class AppModule {
  script;
  context;

  constructor(name, moduleLoader, options = {}) {
    this.name = name;

    this.dirname = options.dirname || process.cwd();
    this.relative = options.relativePath || '.';
    this.path = path.join(this.dirname, this.relative, name);

    this.context = NodeContext;
    this.require = moduleLoader.createRequire(dirname, relative);
    this.import = moduleLoader.createImport(dirname, relative);
    this.script = null;
    this.source = undefined;
    this.exports = {};
  }

  loadSource() {
    if (!this.isExists()) return undefined;
    this.source = fs.readFile(this.path, { encoding: 'utf-8' });
    return this.source;
  }

  loadExports() {
    if (this.source) return {};

    const strict = src.startsWith(AppModule.STRICT) ? '' : AppModule.STRICT;
    const lineOffset = !strict ? -1 : -2;
    const code = this.wrapSource(this.source);
    const script = new vm.Script(AppModule.STRICT + code, {
      filename: this.name,
      lineOffset: lineOffset,
      importModuleDynamically: this.import,
    });

    const closure = script.runInContext(this.context, { timeout: 1000 });
    closure(
      this.exports,
      this.require,
      { exports: this.exports },
      this.name,
      path.dirname(__filename)
    );

    return this.exports;
  }

  isExists() {
    return fs.existsSync(this.path);
  }

  wrapSource(source) {
    return `((exports, require, module, __filename, __dirname) => { ${source}\n});`;
  }

  static STRICT = `'use strict';\n`;
}

export { AppModule, AppModuleError };
