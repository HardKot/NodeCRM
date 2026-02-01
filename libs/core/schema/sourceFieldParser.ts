import { SourceParser } from '../../utils';

import {
  ArrayField,
  BaseField,
  EnumField,
  ScalarField,
  ScalarType,
  SchemaField,
  UnknownField,
} from './fields';

interface ScalarFieldSource {
  type: string;
  required?: boolean;
}

interface ObjectFieldSourceKeys {
  [field: string]: FieldSourceType | object;
}

interface ObjectFieldPrototype {
  Prototype: Object;
}

interface ObjectFieldConstructor {
  Constructor: new (...args: any[]) => any;
}

type ObjectFieldSource = ObjectFieldSourceKeys &
  Partial<ObjectFieldPrototype> &
  Partial<ObjectFieldConstructor>;

type FieldSourceType = string | ScalarFieldSource | ObjectFieldSource | FieldSourceType[];

class SourceFieldParser extends SourceParser<BaseField> {
  override parseString(source: string): BaseField {
    // TODO: support typescript interface parsing
    const required = !source.endsWith('?');
    let type = !required ? source.slice(0, -1) : source;

    if (type.includes('|')) {
      return new EnumField(
        type.split('|').map(v => v.trim()),
        required
      );
    }

    type = type.toLocaleString();

    if (this.isScalarType(type)) return new ScalarField(type, required);

    return new UnknownField();
  }
  override parseObject(source: ObjectFieldSource | ScalarFieldSource): BaseField {
    if (this.isObjectFieldSource(source)) return this.buildShameFields(source);

    const { required = false } = source;
    const type = source.type.toLowerCase();

    if (this.isScalarType(type)) return new ScalarField(type, required);

    return new UnknownField();
  }
  override parseArray(source: FieldSourceType[]): BaseField {
    return new ArrayField(this.parse(source[0]), true);
  }

  private buildShameFields(source: ObjectFieldSource) {
    const fieldsEntries = [];
    let proto = null;

    if (this.isSupportPrototype(source)) proto = source['Prototype'];
    if (this.isSupportConstructor(source)) proto = source['Constructor'].prototype;

    delete source['Prototype'];
    delete source['Constructor'];

    source = JSON.parse(JSON.stringify(source));

    for (const field in source) fieldsEntries.push([field, this.parse(source[field])]);

    return new SchemaField(Object.fromEntries(fieldsEntries), proto);
  }
  private isObjectFieldSource(source: any): source is ObjectFieldSource {
    const firstKey = Object.keys(source).at(0);
    return firstKey !== 'type';
  }
  private isScalarType(type: string): type is ScalarType {
    return type in ScalarField.supportTypes;
  }
  private isSupportPrototype(source: any): source is ObjectFieldPrototype {
    const firstKey = Object.keys(source).at(0);
    return firstKey === 'Prototype';
  }
  private isSupportConstructor(source: any): source is ObjectFieldConstructor {
    const firstKey = Object.keys(source).at(0);
    return firstKey === 'Constructor';
  }
}

export { SourceFieldParser };
