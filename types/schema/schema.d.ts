import { BaseField, ValidateResult } from './baseField';
declare class Schema extends BaseField {
    readonly schema: Record<string, BaseField>;
    readonly proto: Object | null;
    constructor(schema: Record<string, BaseField>, proto?: Object | null);
    typeValidate(value: any): ValidateResult;
    transform(value: any): any;
}
export { Schema };
