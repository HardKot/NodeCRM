import { Optional, Types } from '../../utils';
import { BaseField } from './baseField';
import { SourceFieldParser } from './sourceFieldParser';

class SchemaRegistry {
  private registry: Map<symbol | string | object, BaseField> = new Map();
  private sourceParser = new SourceFieldParser();

  public get(key: symbol | string): Optional<BaseField> {
    return Optional.ofNullable(this.registry.get(key));
  }

  public set(key: symbol | string, value: BaseField) {
    this.registry.set(key, value);
  }

  public generateFromSource(source: any): BaseField | null {
    if (this.registry.has(source)) return this.registry.get(source)!;
    if (Types.isNull(source) || Types.isUndefined(source)) return null;
    try {
      const field = this.sourceParser.parse(source);
      this.set(source, field);
      return field;
    } catch (error) {
      return null;
    }
  }
}

export { SchemaRegistry };
