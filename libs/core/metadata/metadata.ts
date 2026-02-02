import { Optional } from '../../utils';

type MetadataKey = string | symbol;

class Metadata {
  constructor(private entries?: [any, any][]) {}

  get<T>(key: MetadataKey): Optional<T> {
    return Optional.empty();
  }

  set<T>(key: MetadataKey, value: T): void {}

  getSubcomponent<T>(subKey: Function) {
    return new Metadata();
  }
}

export { Metadata, MetadataKey };
