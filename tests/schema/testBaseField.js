import { BaseField } from '../../libs/schema/baseField.js';
export class TestBaseField extends BaseField {
    mockedValidateType;
    mockedTransform;
    constructor(mockedValidateType, mockedTransform, required = false, tests = []) {
        super(required, tests);
        this.mockedValidateType = mockedValidateType;
        this.mockedTransform = mockedTransform;
    }
    typeValidate(value) {
        return this.mockedValidateType(value);
    }
    transform(value) {
        return this.mockedTransform(value);
    }
}
