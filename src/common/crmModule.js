import path from 'node:path';
import * as vm from 'node:vm';
import * as module from 'node:module';
import fs from 'fs';

const ts = await import('typescript').catch(() => null);

export class CrmModuleError extends Error {}

export class CrmModule {
  #script = null;

  constructor(module, options = {}) {
    const ext = path.extname(module).toLowerCase();
    this.type = CrmModule.detectType(ext);

    this.name = options.name || path.basename(module, ext);

    this.dirname = options.dirname || process.cwd();
    this.relative = options.relativePath || '.';
    this.path = path.isAbsolute(module) ? module : path.join(this.dirname, this.relative, module);

    this.exports = {};

    this.context = vm.createContext({
      ...CrmModule.DEFAULT_CONTEXT,
      ...CrmModule.NODE_CONTEXT,
      ...(options.context ?? CrmModule.EMPTY_CONTEXT),
    });

    this.runOptions = Object.freeze({
      timeout: 1000,
      ...(options.runOptions ?? {}),
    });
  }

  isExists() {
    return fs.existsSync(this.path);
  }

  async load() {
    if (!this.isExists()) throw new CrmModuleError(`File ${this.path} doesn't exist`);
    if (this.type === CrmModule.TYPE.TS) {
      await this.#loadTS();
    } else if (this.type === CrmModule.TYPE.COMMONJS) {
      await this.#loadCommon();
    } else if (this.type === CrmModule.TYPE.ESM) {
      throw new CrmModuleError('ESM modules are not supported');
    } else {
      throw new CrmModuleError(`Unable to load module: ${this.path}`);
    }
    Object.freeze(this);
    Object.freeze(this.exports);
    return this;
  }

  #loadCommon() {
    const src = fs.readFileSync(this.path, { encoding: 'utf8' });
    const useStrict = src.startsWith("'use strict'");
    const code = CrmModule.wrapperCommonjs(src);
    this.#script = new vm.Script(code, {
      filename: this.path,
      lineOffset: useStrict ? -1 : 0,
    });
    const exports = this.#script.runInContext(this.context, this.runOptions);
    this.exports = this.#exportCommon(exports);
  }

  #loadTS() {
    if (!ts) throw new CrmModuleError('TypeScript compiler not installed');
    const src = fs.readFileSync(this.path, { encoding: 'utf8' });
    const compiled = ts.transpileModule(src, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        sourceMap: true,
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
      },
      fileName: this.relative,
    }).outputText;
    const useStrict = compiled.startsWith("'use strict'");
    const code = CrmModule.wrapperCommonjs(compiled);
    this.#script = new vm.Script(code, {
      filename: this.path,
      lineOffset: useStrict ? -1 : 0,
    });
    const exports = this.#script.runInContext(this.context, this.runOptions);
    this.exports = this.#exportCommon(exports);
  }

  #exportCommon(closure) {
    const exports = {};
    const __filename = this.relative;
    const __dirname = path.dirname(this.relative);
    const module = { exports };
    const require = this.#createRequire();
    closure(exports, require, module, __filename, __dirname);
    return module.exports;
  }

  #createRequire() {
    const { context, runOptions, dirname, relative } = this;
    const internalRequire = module.createRequire(path.join(process.cwd(), relative));
    function require(name) {
      const npm = !name.startsWith('.') && !path.isAbsolute(name);
      const node = module.isBuiltin(name);
      if (npm || node) return internalRequire(name);
      const resolvedPath = path.resolve(dirname, name);
      if (!fs.existsSync(resolvedPath)) throw new CrmModuleError(`Cannot find module '${name}'`);
      const script = new CrmModule(resolvedPath, { context, runOptions });
      if (script.type !== CrmModule.TYPE.COMMONJS) {
        throw new CrmModuleError(
          `Cannot load module '${name}': only CommonJS modules are supported`
        );
      }

      try {
        script.#loadCommon();
        return script.exports;
      } catch (e) {
        throw new CrmModuleError(`Cannot load module '${name}': ${e.message}`);
      }
    }
    return require;
  }

  static EMPTY_CONTEXT = Object.freeze({});
  static DEFAULT_CONTEXT = Object.freeze({
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
  static NODE_CONTEXT = Object.freeze({
    global,
    process,
    console,
  });
  static TYPE = Object.freeze({
    COMMONJS: Symbol(),
    ESM: Symbol(),
    TS: Symbol(),
  });

  static wrapperCommonjs(code) {
    return `(function (exports, require, module, __filename, __dirname) { ${code} \n});`;
  }

  static detectType(ext) {
    if (ext === '.ts') return CrmModule.TYPE.TS;
    if (ext === '.mjs') return CrmModule.TYPE.ESM;
    if (ext === '.cjs') return CrmModule.TYPE.COMMONJS;
    return CrmModule.TYPE.COMMONJS;
  }
}
