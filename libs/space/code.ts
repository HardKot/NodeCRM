import * as path from 'node:path';
import * as vm from 'node:vm';
import { Types } from '../utils';
import * as Module from 'node:module';

interface CommonJSModule {
  exports: any;
}

interface CommonClosure<T> {
  (
    exports: T | null | {} | Partial<T>,
    require: (name: string) => any,
    module: CommonJSModule,
    __filename: string,
    __dirname: string
  ): any;
}

class CodeError extends Error {}

class Code<T = Object> {
  public path: string;
  public require: { (modulePath: string, extra?: Object): any };
  public import: { (specifier: string): Promise<any> };
  public context: vm.Context;
  public type: number;
  public exports: T | null = null;

  constructor(
    public source: string,
    public name: string,
    type?: CodeTypeValue | number,

    requireFrom: (modulePath: string) => any = () => null,
    importFrom: { (specifier: string): Promise<any> } = () =>
      Promise.reject(new CodeError('Import is not supported in this environment')),

    public dirname = process.cwd(),
    public relative = '.',
    pathTo = path.join(dirname, relative, name),

    context: Record<string, any> = EMPTY_CONTEXT,
    private runOptions: vm.RunningScriptOptions = { timeout: 1000 }
  ) {
    if (Types.isString(type)) {
      const upper = type.toUpperCase() as CodeTypeValue;
      this.type = CodeType[upper] ?? CodeType.COMMONJS;
    } else if (Types.isNumber(type)) {
      if (type < 0 || type > 2) type = CodeType.COMMONJS;
      this.type = type;
    } else {
      this.type = CodeType[this.definitionType()];
    }

    this.path = pathTo;
    this.require = requireFrom;
    this.import = importFrom;
    this.context = vm.createContext(context);
  }

  load() {
    if (this.type === CodeType.COMMONJS) {
      return this.loadCommonJS();
    }
    if (this.type === CodeType.ESM) {
      return this.loadESM();
    }
    if (this.type === CodeType.TS) {
      return this.loadTS();
    }
    throw new CodeError(`Unable to load module: ${this.path}`);
  }

  private loadCommonJS(source?: string) {
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

  private exportCommon(closure: CommonClosure<T>) {
    const __filename = this.relative;
    const __dirname = path.dirname(this.relative);
    const _module = { exports: {} };
    Object.setPrototypeOf(_module.exports, null);
    Object.setPrototypeOf(_module, null);
    closure(_module.exports, this.requireDependency.bind(this), _module, __filename, __dirname);
    return _module.exports as T;
  }

  private async loadESM(source?: string) {
    if (!source) source = this.source;
    const esmModule = new vm.SourceTextModule(source, {
      context: this.context,
      identifier: this.path,
      initializeImportMeta: meta => {
        meta.url = `file://${this.path}`;
      },
    });

    await esmModule.link(this.esmLinker.bind(this));
    await esmModule.evaluate();

    const exports = esmModule.namespace as T;
    this.exports = exports;
    return exports;
  }

  private loadTS() {
    const source = Module.stripTypeScriptTypes(this.source, {
      mode: 'strip',
      sourceUrl: this.path,
    });

    return this.loadCommonJS(source);
  }

  private definitionType(): CodeTypeValue {
    const ext = path.extname(this.name).toLowerCase();
    if (ext === '.ts') return 'TS';
    if (ext === '.mjs') return 'ESM';
    if (ext === '.cjs') return 'COMMONJS';

    return 'COMMONJS';
  }

  private requireDependency(modulePath: string, extra?: Object) {
    if (path.isAbsolute(modulePath) || modulePath.startsWith('.')) {
      modulePath = path.resolve(path.dirname(this.path), modulePath);
    }
    if (!extra) return this.require(modulePath);
    return this.require(modulePath, extra);
  }
  private async esmLinker(specifier: string, _: vm.Module, extra?: Object) {
    const imported = await this.requireDependency(specifier, extra);
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

    await syntheticModule.link(this.esmLinker.bind(this));
    await syntheticModule.evaluate();

    return syntheticModule;
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

const CodeType = Object.freeze({
  COMMONJS: 0,
  ESM: 1,
  TS: 2,
});
type CodeTypeValue = keyof typeof CodeType;

export { CodeType, Code, CodeError, NODE_CONTEXT, DEFAULT_CONTEXT, CodeTypeValue };
