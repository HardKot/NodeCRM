import { Optional } from '../utils';

type MetadataKey = string | symbol;
type MetadataEntriesRecord = Record<MetadataKey, any>;
type MetadataEntriesIterable = Iterable<readonly [MetadataKey, any]>;

class MetadataError extends Error {}

class Metadata extends Map<MetadataKey, any> {
  static from(entries: MetadataEntriesIterable): Metadata;
  static from(entries: MetadataEntriesRecord): Metadata;
  static from(entries: MetadataEntriesIterable | MetadataEntriesRecord): Metadata {
    if (Symbol.iterator in entries) {
      return new Metadata(entries as MetadataEntriesIterable);
    }

    return new Metadata(Object.entries(entries));
  }

  override get<T>(key: MetadataKey): Optional<T> {
    return Optional.ofNullable(super.get(key));
  }

  override set<T>(key: MetadataKey, value: T) {
    return super.set(key, value);
  }

  getSubcomponent<T>(subKey: Function) {
    return new Metadata();
  }

  static readonly KEY = '__metadata__';

  static Link(target: any, table: Record<string, any>): void;
  static Link(target: any, key: MetadataKey, value: any): void;
  static Link(target: any, keyOrTable: MetadataKey | Record<string, any>, value?: any): void {
    if (target === null || target === undefined) throw new MetadataError(`Cannot link metadata to null or undefined target`);
    if (!target[Metadata.KEY]) target[Metadata.KEY] = {};

    if (typeof keyOrTable === 'object') {
      for (const [key, val] of Object.entries(keyOrTable)) target[Metadata.KEY][key] = val;
    } else {
      target[Metadata.KEY][keyOrTable] = value;
    }
  }
}

export { Metadata, MetadataKey };
