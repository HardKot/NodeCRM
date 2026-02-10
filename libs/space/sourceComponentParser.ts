import { SourceParser } from '../utils';
import { Component, Metadata } from '../core';
import {
  ClassWithMetadata,
  FunctionWithMetadata,
  ObjectWithMetadata,
  SourceMetadataParser,
} from './sourceMetadataParser';

interface ComponentParserOptions {
  name?: symbol;
  metadata?: Metadata;
}

interface ObjectComponent extends ObjectWithMetadata {
  name?: string;
  factory?: () => unknown;
}
interface FunctionComponent extends FunctionWithMetadata {}
interface ClassComponent extends ClassWithMetadata {}
type SourceComponentType = ObjectComponent | FunctionComponent | ClassComponent;

class SourceComponentParser extends SourceParser<Component, ComponentParserOptions> {
  constructor(private metadataParser: SourceMetadataParser) {
    super();
  }

  override parseObject(source: ObjectComponent, options: ComponentParserOptions) {
    return new Component(
      source.name ?? options?.name ?? Symbol(),
      source.factory ?? (() => source),
      options?.metadata ?? this.metadataParser.parseObject(source),
      source
    );
  }
  override parseFunction(source: FunctionComponent, options: ComponentParserOptions) {
    return new Component(
      source.name ?? options?.name ?? Symbol(),
      deps => source.bind(deps),
      options?.metadata ?? this.metadataParser.parseFunction(source),
      source
    );
  }
  override parseClass(source: ClassComponent, options: ComponentParserOptions) {
    return new Component(
      source.name ?? options?.name ?? Symbol(),
      deps => new source(...Object.values(deps)),
      options?.metadata ?? this.metadataParser.parseClass(source),
      source
    );
  }
}

export {
  ComponentParserOptions,
  ObjectComponent,
  SourceComponentParser,
  FunctionComponent,
  ClassComponent,
  SourceComponentType,
};
