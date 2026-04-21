import { ISpace } from './ISpace';
import { ModuleExtractor } from './moduleExtractor';
import { ComponentTypeValue, Module } from '../core';
interface ComponentAssociated {
    [key: string]: ComponentTypeValue;
    service: 'PROVIDER';
    controller: 'CONSUMER';
}
interface VirtualSpaceConfig {
    path?: string;
    rootModule?: string;
    moduleExtractor?: ModuleExtractor;
    associated?: ComponentAssociated;
}
declare const SpaceMetadataKey: any;
declare const DEFAULT_ASSOCIATED: ComponentAssociated;
declare class Space implements ISpace {
    readonly path: string;
    readonly rootName: string;
    readonly extractor: ModuleExtractor;
    readonly associated: ComponentAssociated;
    static factory(config?: VirtualSpaceConfig): () => unknown;
    static create(config?: VirtualSpaceConfig): unknown;
    current: Module;
    private modules;
    private moduleGraph;
    private metadataParser;
    private componentParser;
    private moduleParser;
    constructor(path?: string, rootName?: string, extractor?: ModuleExtractor, associated?: ComponentAssociated);
    load(): any;
    private loadSpaceFiles;
    private loadCode;
    private moduleFromPath;
    private groupFilesByModule;
    private linkModuleFromPath;
    private getComponentTypeByPath;
    private getModuleNameByPath;
    private getModuleVariantNames;
}
export { Space, DEFAULT_ASSOCIATED, SpaceMetadataKey };
