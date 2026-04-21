import * as events from 'node:events';
import { ISpace } from './ISpace';
import { ModuleExtractor } from './moduleExtractor';
import { Module } from '../core';
interface VirtualSpaceConfig {
    path?: string;
    context?: Record<string, any>;
    watchTimeout?: number;
    rootModuleName?: string;
    rootExtractor?: ModuleExtractor;
    preprocessor?: (code: string) => string;
}
declare class VirtualSpace extends events.EventEmitter implements ISpace {
    [x: number]: () => {
        next(): any;
    };
    readonly path: string;
    readonly codeContext: {};
    readonly watchTimeout: number;
    readonly rootName: string;
    readonly extractor: ModuleExtractor;
    readonly preprocessor?: ((code: string) => string) | undefined;
    static factory(config?: VirtualSpaceConfig): unknown;
    private codes;
    private modules;
    current: Module;
    constructor(path?: string, codeContext?: {}, watchTimeout?: number, rootName?: string, extractor?: ModuleExtractor, preprocessor?: ((code: string) => string) | undefined);
    load(): any;
    watch(): void;
    onUpdate(listener: (module: Module) => void): () => any;
    private loadFiles;
    private loadCode;
    private createRequire;
    private createImport;
    private getModuleName;
}
export { VirtualSpace };
