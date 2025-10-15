import path from 'node:path';
import * as vm from 'node:vm';
import * as module from 'node:module';
import fs from 'fs';

export class ScriptError extends Error {}

export class Script {
  #script = null;

  constructor(module, options = {}) {
    const ext = path.extname(module).toLowerCase();

    this.name = options.name || path.basename(module, ext);
    this.dirname = options.dirname || path.dirname(module);
    this.relative = options.relativePath || path.relative(process.cwd(), module);

    this.context = vm.createContext({
      ...Script.DEFAULT_CONTEXT,
      ...Script.NODE_CONTEXT,
      ...(options.context ?? Script.EMPTY_CONTEXT),
    });

    this.runOptions = Object.freeze({
      timeout: 1000,
      ...(options.runOptions ?? {}),
    });
  }

  loadCommon() {
    const src = fs.readFileSync(this.relative, 'utf-8');

    const useStrict = src.startsWith("'use strict'");
    const code = Script.wrapperCommonjs(src);

    this.#script = new vm.Script(code, {
      filename: this.relative,
      lineOffset: useStrict ? -1 : 0,
    });

    const exports = this.#script.runInContext(this.context, this.runOptions);
    this.exports = this.exportCommon(exports);
  }

  exportCommon(closure) {
    const exports = {};
    const __filename = this.relative;
    const __dirname = path.dirname(this.relative);
    const module = { exports };
    const require = this.createRequire();

    closure(exports, require, module, __filename, __dirname);

    return module.exports;
  }

  createRequire() {
    const { context, runOptions, dirname, relative } = this;
    const internalRequire = module.createRequire(path.join(process.cwd(), relative));

    function require(name) {
      const npm = !name.startsWith('.') && !path.isAbsolute(name);
      const node = module.isBuiltin(name);
      if (npm || node) return internalRequire(name);

      const resolvedPath = path.resolve(dirname, name);
      console.log('Resolved Path:', resolvedPath);
      if (!fs.existsSync(resolvedPath)) throw new ScriptError(`Cannot find module '${name}'`);

      try {
        const module = new Script(resolvedPath, { context, runOptions });
        module.loadCommon();
        return module.exports;
      } catch (e) {
        throw new ScriptError(`Cannot load module '${name}': ${e.message}`);
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
