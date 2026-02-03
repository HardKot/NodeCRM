import { Optional } from '../../utils';

type MetadataKey = string | symbol;

class Metadata extends Map<MetadataKey, any> {
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
