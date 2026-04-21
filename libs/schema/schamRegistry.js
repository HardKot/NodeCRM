import { Optional, Types } from '../utils';
import { SourceFieldParser } from './sourceFieldParser';
class SchemaRegistry {
    registry = new Map();
    sourceParser = new SourceFieldParser();
    get(key) {
        return Optional.ofNullable(this.registry.get(key));
    }
    set(key, value) {
        this.registry.set(key, value);
    }
    generateFromSource(source) {
        if (this.registry.has(source))
            return this.registry.get(source);
        if (Types.isNull(source) || Types.isUndefined(source))
            return null;
        try {
            const field = this.sourceParser.parse(source);
            this.set(source, field);
            return field;
        }
        catch (error) {
            return null;
        }
    }
}
export { SchemaRegistry };
