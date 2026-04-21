import { SourceParser } from '../utils';
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
declare class SourceMetadataParser extends SourceParser<Metadata> {
    parseObject(source: ObjectWithMetadata): Metadata;
    parseFunction(source: FunctionWithMetadata): Metadata;
    parseClass(source: ClassWithMetadata): Metadata;
}
export { SourceMetadataParser, FunctionWithMetadata, ClassWithMetadata, ObjectWithMetadata, MetadataSource, };
