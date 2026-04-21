import { Optional } from '../utils';
import { BaseField } from './baseField';
declare class SchemaRegistry {
    private registry;
    private sourceParser;
    get(key: symbol | string): Optional<BaseField>;
    set(key: symbol | string, value: BaseField): void;
    generateFromSource(source: any): BaseField | null;
}
export { SchemaRegistry };
