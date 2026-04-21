import * as path from 'node:path';
import * as vm from 'node:vm';
import { Types } from '../utils';
import * as Module from 'node:module';
class CodeError extends Error {
}
class Code {
    source;
    name;
    dirname;
    relative;
    runOptions;
    path;
    require;
    import;
    context;
    type;
    exports = null;
    constructor(source, name, type, requireFrom = () => null, importFrom = () => Promise.reject(new CodeError('Import is not supported in this environment')), dirname = process.cwd(), relative = '.', pathTo = path.join(dirname, relative, name), context = DEFAULT_CONTEXT, runOptions = { timeout: 1000 }) {
        this.source = source;
        this.name = name;
        this.dirname = dirname;
        this.relative = relative;
        this.runOptions = runOptions;
        if (Types.isString(type)) {
            const upper = type.toUpperCase();
            this.type = CodeType[upper] ?? CodeType.COMMONJS;
        }
        else if (Types.isNumber(type)) {
            if (type < 0 || type > 2)
                type = CodeType.COMMONJS;
            this.type = type;
        }
        else {
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
    loadCommonJS(source) {
        if (!source)
            source = this.source;
        const wrap = `(function (exports, require, module, __filename, __dirname) {\n${source}\n});`;
        const useStrict = source.startsWith("'use strict'");
        const script = new vm.Script(wrap, {
            filename: this.path,
            lineOffset: useStrict ? -2 : -1,
        });
        const closure = script.runInContext(this.context, this.runOptions);
        this.exports = this.exportCommon(closure);
        return this.exports;
    }
    exportCommon(closure) {
        const __filename = this.relative;
        const __dirname = path.dirname(this.relative);
        const _module = { exports: {} };
        Object.setPrototypeOf(_module.exports, null);
        Object.setPrototypeOf(_module, null);
        closure(_module.exports, this.requireDependency.bind(this), _module, __filename, __dirname);
        return _module.exports;
    }
    async loadESM(source) {
        if (!source)
            source = this.source;
        const esmModule = new vm.SourceTextModule(source, {
            context: this.context,
            identifier: this.path,
            initializeImportMeta: meta => {
                meta.url = `file://${this.path}`;
            },
        });
        await esmModule.link(this.esmLinker.bind(this));
        await esmModule.evaluate();
        const exports = esmModule.namespace;
        this.exports = exports;
        return exports;
    }
    loadTS() {
        const source = Module.stripTypeScriptTypes(this.source, {
            mode: 'strip',
            sourceUrl: this.path,
        });
        if (this.detectESMSyntax(source)) {
            return this.loadESM(source);
        }
        return this.loadCommonJS(source);
    }
    definitionType() {
        const ext = path.extname(this.name).toLowerCase();
        if (ext === '.ts')
            return 'TS';
        if (ext === '.mjs')
            return 'ESM';
        if (ext === '.cjs')
            return 'COMMONJS';
        if (ext === '.js') {
            const hasESMSyntax = this.detectESMSyntax(this.source);
            if (hasESMSyntax)
                return 'ESM';
        }
        return 'COMMONJS';
    }
    detectESMSyntax(source) {
        const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '');
        const esmPatterns = [
            /^\s*import\s+/m,
            /^\s*export\s+/m,
            /^\s*export\s+default\s+/m,
            /^\s*import\s*\(/m,
        ];
        return esmPatterns.some(pattern => pattern.test(withoutComments));
    }
    requireDependency(modulePath, extra) {
        if (path.isAbsolute(modulePath) || modulePath.startsWith('.')) {
            modulePath = path.resolve(path.dirname(this.path), modulePath);
        }
        if (!extra)
            return this.require(modulePath);
        return this.require(modulePath, extra);
    }
    async requireDependencyAsync(modulePath, extra) {
        try {
            if (!modulePath.startsWith('.') && !path.isAbsolute(modulePath)) {
                return await this.require(modulePath);
            }
            if (path.isAbsolute(modulePath) || modulePath.startsWith('.')) {
                modulePath = path.resolve(path.dirname(this.path), modulePath);
            }
            const result = extra ? this.require(modulePath, extra) : this.require(modulePath);
            if (Types.isPromise(result))
                return await result;
            return result;
        }
        catch (error) {
            throw new CodeError(`Failed to import module "${modulePath}": ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async esmLinker(specifier, _, extra) {
        const imported = await this.requireDependencyAsync(specifier, extra);
        const exportNames = Object.keys(imported);
        const syntheticModule = new vm.SyntheticModule(exportNames, function () {
            exportNames.forEach(key => {
                this.setExport(key, imported[key]);
            });
        }, {
            context: this.context,
        });
        await syntheticModule.link(this.esmLinker.bind(this));
        await syntheticModule.evaluate();
        return syntheticModule;
    }
    static supportExtension = Object.freeze(['.js', '.cjs', '.mjs', '.ts']);
}
const EMPTY_CONTEXT = {};
const DEFAULT_CONTEXT = {
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
};
const NODE_CONTEXT = {
    ...DEFAULT_CONTEXT,
    global,
    process,
    console,
};
const CodeType = Object.freeze({
    COMMONJS: 0,
    ESM: 1,
    TS: 2,
});
export { CodeType, Code, CodeError, NODE_CONTEXT, DEFAULT_CONTEXT };
