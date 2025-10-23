import path from 'node:path';
import * as vm from 'node:vm';
import * as module from 'node:module';
import fs from 'fs';

import { CrmModule, CrmModuleError } from './crmModule';

const ts = await import('typescript').catch(() => null);

class CrmVmModule extends CrmModule {
  static caches = new Map();
  #script = null;

  constructor(module, options = {}) {
    super(module, options);

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

  async load() {
    if (!this.isExists()) throw new CrmModuleError(`File ${this.path} doesn't exist`);
    if (this.type === CrmModule.TYPE.TS) {
      this.#loadTS();
    } else if (this.type === CrmModule.TYPE.COMMONJS) {
      this.#loadCommon();
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
      const script = new CrmVmModule(resolvedPath, { context, runOptions });
      if (!script.isExists()) throw new CrmModuleError(`Module ${script.name}, not found`);

      const cacheKey = script.path;
      if (CrmVmModule.caches.has(cacheKey)) return CrmVmModule.caches.get(cacheKey).exports;

      try {
        if (script.type === CrmModule.TYPE.COMMONJS) {
          script.#loadCommon();
        } else if (script.type === CrmModule.TYPE.TS) {
          script.#loadTS();
        } else {
          throw new CrmModuleError(
            `Cannot load module '${name}': only CommonJS modules are supported`
          );
        }

        CrmVmModule.caches.set(cacheKey, script);

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

  static wrapperCommonjs(code) {
    return `(function (exports, require, module, __filename, __dirname) { ${code} \n});`;
  }
}

export { CrmVmModule };
