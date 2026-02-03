import { FunctionUtils, SourceParser } from '../../utils';
import { Metadata } from './metadata';

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

class SourceMetadataParser extends SourceParser {
  override parseObject(source: ObjectWithMetadata) {
    return new Metadata(
      Object.entries(source)
        .filter(([key]) => key.startsWith('$'))
        .map(([key, value]) => [key.slice(1), value])
    );
  }
  override parseFunction(source: FunctionWithMetadata) {
    if (source.metadata) return new Metadata(Object.entries(source.metadata));
    return this.parseObject(source);
  }
  override parseClass(source: ClassWithMetadata) {
    if (source.metadata) new Metadata();
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
