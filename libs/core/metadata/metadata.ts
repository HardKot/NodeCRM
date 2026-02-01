import { Optional } from '../../utils';

type MetadataKey = string | symbol;

class Metadata {
  constructor(private entries?: [any, any][]) {}

  get<T>(key: MetadataKey): Optional<T> {
    return Optional.empty();
  }

  set<T>(key: MetadataKey, value: T): void {}
}

export { Metadata, MetadataKey };
