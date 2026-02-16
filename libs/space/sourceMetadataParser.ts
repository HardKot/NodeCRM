import { FunctionUtils, SourceParser } from '../utils';
import { Metadata } from '../core/metadata';

interface ObjectWithMetadata extends Object {
  [keys: `${string}`]: any;
  [keys: `$${string}`]: any;
}

interface FunctionWithMetadata extends Function {
  metadata?: Record<string, any>;
  [keys: `$${string}`]: any;
  [keys: `${string}`]: any;
}

interface ClassWithMetadata {
  new (...args: any[]): any;
  metadata?: Record<string, any>;
  [keys: `$${string}`]: any;
  [keys: string]: any;
}

type MetadataSource = ObjectWithMetadata | FunctionWithMetadata | ClassWithMetadata;

class SourceMetadataParser extends SourceParser<Metadata> {
  override parseObject(source: ObjectWithMetadata) {
    return new Metadata(
      Object.entries(source)
        .filter(([key]) => key.startsWith('$'))
        .map(([key, value]) => [key.slice(1), value])
    );
  }
  override parseFunction(source: FunctionWithMetadata) {
    if (source[Metadata.KEY]) return new Metadata(Object.entries(source[Metadata.KEY]));
    return this.parseObject(source);
  }
  override parseClass(source: ClassWithMetadata) {
    if (source[Metadata.KEY]) new Metadata();
    return this.parseObject(source);
  }
}

export {
  SourceMetadataParser,
  FunctionWithMetadata,
  ClassWithMetadata,
  ObjectWithMetadata,
  MetadataSource,
};
