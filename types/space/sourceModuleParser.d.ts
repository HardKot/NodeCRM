import { SourceParser } from '../utils';
import { Module, ModuleHook } from '../core';
import { SourceComponentParser, SourceComponentType } from './sourceComponentParser';
type LinkMetadata = (componentSource: SourceComponentType, metadataKey: string | symbol, metadataValue: any) => void;
interface ModuleSource extends ModuleHook {
    imports?: ModuleSource[];
    providers?: SourceComponentType[];
    consumers?: SourceComponentType[];
    metadata?: (link: LinkMetadata) => void;
}
interface ModuleSourceObject extends ModuleSource {
    name?: string;
    factory?: () => any;
}
interface ModuleSourceFunction extends Function, ModuleSource {
}
interface ModuleSourceClass extends ModuleSource {
    new (...args: any[]): any;
}
declare class SourceModuleParser extends SourceParser<Module> {
    private componentParser;
    private moduleStore;
    constructor(componentParser: SourceComponentParser);
    parseObject(source: ModuleSourceObject): any;
    parseFunction(source: ModuleSourceFunction): any;
    parseClass(source: ModuleSourceClass): any;
    private extractMetadataCache;
    private extractMetadata;
    private extractHooks;
    private extractImports;
    private extractComponents;
    private modulePreprocess;
}
export { SourceModuleParser, ModuleSource };
