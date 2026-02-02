import { SourceParser, Types } from '../../utils';
import { BaseField, TestFunction } from './baseField';
import { EnumField } from './enumField';
import { ScalarField, ScalarType } from './scalarField';
import { UnknownField } from './fieldUnknown';
import { ArrayField } from './arrayField';
import { Schema } from './schema';

interface ScalarFieldSource {
  type: string;
  required?: boolean;
  tests?: TestFunction[];
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
    const required = !source.startsWith('?');
    let [type, ...tests] = source.split('|').map(v => v.trim());
    type = !required ? type.slice(1) : type;

    if (type.includes(',')) {
      return new EnumField(
        type.split(',').map(v => v.trim()),
        required
      );
    }

    const scalarType = this.extractScalarType(type.toLocaleString());
    if (!Types.isUndefined(scalarType))
      return new ScalarField(
        scalarType,
        required,
        tests.map(it => this.getTest(it)).filter((it): it is TestFunction => it !== null)
      );

    return new UnknownField();
  }
  override parseObject(source: ObjectFieldSource | ScalarFieldSource): BaseField {
    if (this.isObjectFieldSource(source)) return this.buildShameFields(source);

    const { required = false } = source;

    const scalarType = this.extractScalarType(source.type.toLowerCase());
    if (!Types.isUndefined(scalarType)) return new ScalarField(scalarType, required, source.tests);

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

    return new Schema(Object.fromEntries(fieldsEntries), proto);
  }
  private isObjectFieldSource(source: any): source is ObjectFieldSource {
    const firstKey = Object.keys(source).at(0);
    return firstKey !== 'type';
  }
  private extractScalarType(type: string): ScalarType | undefined {
    const keys = Object.keys(ScalarType).map(it => it.toLowerCase());
    const index = keys.indexOf(type.toLowerCase());
    if (index === -1) return undefined;
    return ScalarType[Object.keys(ScalarType)[index] as keyof typeof ScalarType];
  }
  private isSupportPrototype(source: any): source is ObjectFieldPrototype {
    const firstKey = Object.keys(source).at(0);
    return firstKey === 'Prototype';
  }
  private isSupportConstructor(source: any): source is ObjectFieldConstructor {
    const firstKey = Object.keys(source).at(0);
    return firstKey === 'Constructor';
  }

  private getTest(source: string): TestFunction | null {
    return null;
  }
}

export { SourceFieldParser };
