import { Optional } from '../../utils';
import { BaseField } from './baseField';

class SchemaRegistry {
  private registry: Map<symbol | string, BaseField> = new Map();

  public get(key: symbol | string): Optional<BaseField> {
    return Optional.ofNullable(this.registry.get(key));
  }
}

export { SchemaRegistry };
