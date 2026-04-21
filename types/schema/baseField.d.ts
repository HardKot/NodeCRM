import { Result } from '../utils';
import { ValidateError } from './fieldError';
type ValidateResult = Result<null, ValidateError>;
type TestFunction = (value: any) => [boolean, string];
declare abstract class BaseField {
    required: boolean;
    tests: TestFunction[];
    protected constructor(required: boolean, tests: TestFunction[]);
    validate(value: any): any;
    transform(value: any): any;
    protected test(value: any): ValidateResult;
    protected typeValidate(value: any): ValidateResult;
    parse<T>(value: any): any;
}
export { BaseField, ValidateResult, TestFunction };
