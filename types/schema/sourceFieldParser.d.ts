import { SourceParser } from '../utils';
import { BaseField, TestFunction } from './baseField';
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
type ObjectFieldSource = ObjectFieldSourceKeys & Partial<ObjectFieldPrototype> & Partial<ObjectFieldConstructor>;
type FieldSourceType = string | ScalarFieldSource | ObjectFieldSource | FieldSourceType[];
declare class SourceFieldParser extends SourceParser<BaseField> {
    parseString(source: string): BaseField;
    parseObject(source: ObjectFieldSource | ScalarFieldSource): BaseField;
    parseArray(source: FieldSourceType[]): BaseField;
    private buildShameFields;
    private isObjectFieldSource;
    private extractScalarType;
    private isSupportPrototype;
    private isSupportConstructor;
    private getTest;
}
export { SourceFieldParser };
