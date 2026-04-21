import { BaseField, TestFunction, ValidateResult } from './baseField';
declare class ArrayField extends BaseField {
    itemField: BaseField;
    constructor(itemField: BaseField, required?: boolean, tests?: TestFunction[]);
    typeValidate(value: any): ValidateResult;
    transform(value: any): any;
}
export { ArrayField };
