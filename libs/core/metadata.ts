import { Optional } from '../utils';

type MetadataKey = string | symbol;
type MetadataEntriesRecord = Record<MetadataKey, any>;
type MetadataEntriesIterable = Iterable<readonly [MetadataKey, any]>;

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
}

export { Metadata, MetadataKey };
