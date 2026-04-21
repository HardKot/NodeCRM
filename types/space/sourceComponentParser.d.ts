import { SourceParser } from '../utils';
import { Component, Metadata, Module } from '../core';
import { ClassWithMetadata, FunctionWithMetadata, ObjectWithMetadata, SourceMetadataParser } from './sourceMetadataParser';
interface ComponentParserOptions {
    name?: symbol;
    metadata?: Metadata;
    module?: Module;
}
interface ObjectComponent extends ObjectWithMetadata {
    name?: string;
    factory?: () => unknown;
}
interface FunctionComponent extends FunctionWithMetadata {
}
interface ClassComponent extends ClassWithMetadata {
}
type SourceComponentType = ObjectComponent | FunctionComponent | ClassComponent;
declare class SourceComponentParser extends SourceParser<Component, ComponentParserOptions> {
    private metadataParser;
    constructor(metadataParser: SourceMetadataParser);
    parseObject(source: ObjectComponent, options: ComponentParserOptions): any;
    parseFunction(source: FunctionComponent, options: ComponentParserOptions): any;
    parseClass(source: ClassComponent, options: ComponentParserOptions): any;
}
export { ComponentParserOptions, ObjectComponent, SourceComponentParser, FunctionComponent, ClassComponent, SourceComponentType, };
