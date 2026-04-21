import { SourceParser } from '../utils';
import { Component } from '../core';
class SourceComponentParser extends SourceParser {
    metadataParser;
    constructor(metadataParser) {
        super();
        this.metadataParser = metadataParser;
    }
    parseObject(source, options) {
        return new Component(source.name ?? options?.name ?? Symbol(), source.factory ?? (() => source), options?.metadata ?? this.metadataParser.parseObject(source), options.module, source);
    }
    parseFunction(source, options) {
        return new Component(source.name ?? options?.name ?? Symbol(), deps => source.bind(deps), options?.metadata ?? this.metadataParser.parseFunction(source), options.module, source);
    }
    parseClass(source, options) {
        return new Component(source.name ?? options?.name ?? Symbol(), deps => new source(...Object.values(deps)), options?.metadata ?? this.metadataParser.parseClass(source), options.module, source);
    }
}
export { SourceComponentParser, };
