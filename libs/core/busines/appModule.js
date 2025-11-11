import path from 'node:path';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';

import { NodeContext } from './runTimeContext';

class AppModuleError extends Error {}

class AppModule {
  constructor(name, options = {}) {
    this.name = name;

    this.dirname = options.dirname || process.cwd();
    this.relative = options.relativePath || '.';
    this.path = path.join(this.dirname, this.relative, name);

    this.context = NodeContext;
    this.require = options?.createRequire(this.dirname, this.relative);
    this.import = options?.createImport(this.dirname, this.relative);
    this.source = undefined;
    this.exports = {};
  }

  async loadSource() {
    if (!this.isExists()) return undefined;
    this.source = fsp.readFile(this.path, { encoding: 'utf-8' });

    if (this.path.endsWith('.ts')) {
      const transpileModule = ts.transpileModule(this.source, {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2020,
          sourceMap: true,
          inlineSources: true,
          inlineSourceMap: true,
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
        },
        fileName: this.path,
      });

      this.source = transpileModule.outputText;
    }
    return this.source;
  }

  loadExports() {
    if (!this.source) return {};

    const strict = this.source.startsWith(AppModule.STRICT) ? '' : AppModule.STRICT;
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
