import { BaseField, TestFunction, ValidateResult } from './baseField';
declare const ScalarType: any;
declare class ScalarField extends BaseField {
    readonly scalar: number;
    constructor(scalar: number, required?: boolean, tests?: TestFunction[]);
    protected typeValidate(value: any): ValidateResult;
    transform(value: any): string | number | boolean | undefined;
    private toString;
    private toNumber;
    private toBoolean;
    private toInt;
}
export { ScalarField, ScalarType };
