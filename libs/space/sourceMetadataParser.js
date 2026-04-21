import { SourceParser } from '../utils';
import { Metadata } from '../core/metadata';
class SourceMetadataParser extends SourceParser {
    parseObject(source) {
        return new Metadata(Object.entries(source)
            .filter(([key]) => key.startsWith('$'))
            .map(([key, value]) => [key.slice(1), value]));
    }
    parseFunction(source) {
        if (source[Metadata.KEY])
            return new Metadata(Object.entries(source[Metadata.KEY]));
        return this.parseObject(source);
    }
    parseClass(source) {
        if (source[Metadata.KEY])
            new Metadata();
        return this.parseObject(source);
    }
}
export { SourceMetadataParser, };
