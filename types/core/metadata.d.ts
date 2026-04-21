import { Optional } from '../utils';
import type { MetadataEntriesIterable, MetadataEntriesRecord, MetadataKey } from './types';
declare class Metadata extends Map<MetadataKey, any> {
    static from(entries: MetadataEntriesIterable): Metadata;
    static from(entries: MetadataEntriesRecord): Metadata;
    get<T>(key: MetadataKey): Optional<T>;
    set<T>(key: MetadataKey, value: T): any;
    getSubcomponent<T>(subKey: Function): Metadata;
    static readonly KEY = "__metadata__";
    static Link(target: any, table: Record<string, any>): void;
    static Link(target: any, key: MetadataKey, value: any): void;
}
export { Metadata, MetadataKey };
