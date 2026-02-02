import { BaseField } from '../baseField';

export class TestBaseField extends BaseField {
  constructor(
    private mockedValidateType: Function,
    private mockedTransform: Function,
    required = false,
    tests = []
  ) {
    super(required, tests);
  }

  override typeValidate(value: any) {
    return this.mockedValidateType(value);
  }

  override transform(value: any) {
    return this.mockedTransform(value);
  }
}
