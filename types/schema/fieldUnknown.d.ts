import { BaseField, ValidateResult } from './baseField';
declare class UnknownField extends BaseField {
    constructor();
    typeValidate(): ValidateResult;
    transform(value: any): any;
}
export { UnknownField };
