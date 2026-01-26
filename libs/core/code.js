import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const ts = await import('typescript').catch(() => null);

class CodeError extends Error {}

class Code {
  constructor(source, options = {}) {
    this.source = source;
    this.name = options.name;
    this.dirname = options.dirname ?? process.cwd();
    this.relative = options.relative ?? '.';
    this.path = path.join(this.dirname, this.relative, this.name);
    this.type = options.type ?? this.definitionType();

    this.runOptions = Object.freeze({
      timeout: 1000,
      ...(options.runOptions ?? {}),
    });
    this.context = vm.createContext(options.context ?? EMPTY_CONTEXT);

    this.require = createRequire(this.path);
    if (options.createRequire) {
      this.require = options.createRequire(this.path);
    }

    this.import = options.import || (resolve => import(path.join(this.path, resolve)));
    this.exports = {};
  }

  autoLoad() {
    if (this.type === CODE_TYPE.COMMONJS) {
      return this.loadCommonJS();
    }
    if (this.type === CODE_TYPE.ESM) {
      return this.loadESM();
    }
    if (this.type === CODE_TYPE.TS) {
      return this.loadTS();
    }
    throw new CodeError(`Unable to load module: ${this.path}`);
  }

  loadCommonJS(source) {
    if (!source) source = this.source;
    const wrap = `(function (exports, require, module, __filename, __dirname) {\n${source}\n});`;
    const useStrict = source.startsWith("'use strict'");

    const script = new vm.Script(wrap, {
      filename: this.path,
      lineOffset: useStrict ? -2 : -1,
    });

    const closure = script.runInContext(Object.freeze(this.context), this.runOptions);
    this.exports = this.exportCommon(closure);

    return this.exports;
  }

  async loadESM(source) {
    if (!source) source = this.source;
    const esmModule = new vm.SourceTextModule(source, {
      context: this.context,
      identifier: this.path,
      initializeImportMeta: meta => {
        meta.url = `file://${this.path}`;
      },
    });

    await esmModule.link(async specifier => {
      const imported = await this.requireDependency(specifier);
      const exportNames = Object.keys(imported);

      const syntheticModule = new vm.SyntheticModule(
        exportNames,
        function () {
          exportNames.forEach(key => {
            this.setExport(key, imported[key]);
          });
        },
        {
          context: this.context,
        }
      );

      await syntheticModule.link(() => {});
      await syntheticModule.evaluate();

      return syntheticModule;
    });

    await esmModule.evaluate();
    this.exports = esmModule.namespace;
    return this.exports;
  }

  loadTS(source) {
    if (!source) source = this.source;
    if (!ts) throw new CodeError('TypeScript compiler not installed');
    const compile = ts.transpileModule(source, {
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
    }).outputText;

    return this.loadCommonJS(compile);
  }

  exportCommon(closure) {
    const __filename = this.relative;
    const __dirname = path.dirname(this.relative);
    const module = { exports: {} };
    Object.setPrototypeOf(module.exports, null);
    Object.setPrototypeOf(module, null);
    closure(module.exports, this.requireDependency.bind(this), module, __filename, __dirname);
    return module.exports;
  }

  definitionType() {
    const ext = path.extname(this.name).toLowerCase();
    if (ext === '.ts') return CODE_TYPE.TS;
    if (ext === '.mjs') return CODE_TYPE.ESM;
    if (ext === '.cjs') return CODE_TYPE.COMMONJS;

    return CODE_TYPE.COMMONJS;
  }

  requireDependency(modulePath) {
    if (path.isAbsolute(modulePath) || modulePath.startsWith('.')) {
      modulePath = path.resolve(path.dirname(this.path), modulePath);
    }
    return this.require(modulePath);
  }

  static supportExtension = Object.freeze(['.js', '.cjs', '.mjs', '.ts']);
}

const EMPTY_CONTEXT = Object.freeze({});
const DEFAULT_CONTEXT = Object.freeze({
  AbortController,
  AbortSignal,
  Event,
  EventTarget,
  MessageChannel,
  MessageEvent,
  MessagePort,
  Buffer,
  Blob,
  FormData,
  Headers,
  Response,
  Request,
  ByteLengthQueuingStrategy,
  URL,
  URLSearchParams,
  TextDecoder,
  TextEncoder,
  TextDecoderStream,
  TextEncoderStream,
  WebAssembly,
  queueMicrotask,
  setTimeout,
  setImmediate,
  setInterval,
  clearTimeout,
  clearImmediate,
  clearInterval,
  BroadcastChannel,
  CompressionStream,
  DecompressionStream,
  CountQueuingStrategy,
  fetch,
});
const NODE_CONTEXT = Object.freeze({
  ...DEFAULT_CONTEXT,
  global,
  process,
  console,
});

const CODE_TYPE = Object.freeze({
  COMMONJS: 0,
  ESM: 1,
  TS: 2,
});

export { CODE_TYPE, Code, CodeError, NODE_CONTEXT, DEFAULT_CONTEXT };
