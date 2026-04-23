const { BaseField } = require('../../libs/schema/baseField.js');
class TestBaseField extends BaseField {
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

exports.TestBaseField = TestBaseField;