import { BaseField, ValidateResult } from './baseField';
declare class EnumField extends BaseField {
    readonly values: string[];
    constructor(values: string[], required?: boolean);
    typeValidate(value: any): ValidateResult;
    transform(value: any): any;
}
export { EnumField };
