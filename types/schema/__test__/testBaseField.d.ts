import { BaseField } from '../baseField';
export declare class TestBaseField extends BaseField {
    private mockedValidateType;
    private mockedTransform;
    constructor(mockedValidateType: Function, mockedTransform: Function, required?: boolean, tests?: {});
    typeValidate(value: any): any;
    transform(value: any): any;
}
