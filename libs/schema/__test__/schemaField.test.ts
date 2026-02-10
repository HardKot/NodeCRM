import { Schema } from '../schema';
import { BaseField } from '../baseField';
import { Result } from '../../utils';
import { ValidateError } from '../fieldError';
import { TestBaseField } from './testBaseField';

describe('Schema', () => {
  let mockValidateField: BaseField;
  const mockedValidateType = jest.fn();
  const mockedTransform = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockValidateField = new TestBaseField(mockedValidateType, mockedTransform);
  });

  describe('Schema check', () => {
    it('should validate object with valid fields', () => {
      const field = new Schema({
        a: mockValidateField,
        b: mockValidateField,
      });
      mockedValidateType.mockReturnValue(Result.success(null));
      const result = field.validate({ a: 1, b: 2 });
      expect(result.isSuccess).toBe(true);
    });

    it('should invalidate object with invalid fields', () => {
      const field = new Schema({
        a: mockValidateField,
        b: mockValidateField,
      });
      mockedValidateType.mockReturnValueOnce(Result.failure(new ValidateError('Invalid field')));
      const result = field.validate({ a: 1, b: 2 });
      expect(result.isSuccess).toBe(false);
    });

    it('should invalidate non-object values', () => {
      const field = new Schema({
        a: mockValidateField,
      });
      const result = field.validate('not an object');
      expect(result.isSuccess).toBe(false);
    });

    it('should call field check for each schema field', () => {
      const field = new Schema({
        a: mockValidateField,
        b: mockValidateField,
        c: mockValidateField,
      });
      mockedValidateType.mockReturnValue(Result.success(null));
      field.validate({ a: 1, b: 2, c: 3 });
      expect(mockedValidateType).toHaveBeenCalledTimes(3);
    });
  });

  describe('Schema transform', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should transform object fields according to schema', () => {
      const field = new Schema({
        a: mockValidateField,
        b: mockValidateField,
      });
      mockedTransform.mockImplementation(value => value * 2);
      const result = field.transform({ a: 1, b: 2 });
      expect(result).toEqual({ a: 2, b: 4 });
    });
    it('should set the prototype of the transformed object', () => {
      const proto = { customMethod: () => 'hello' };
      const field = new Schema(
        {
          a: mockValidateField,
        },
        proto
      );
      mockedTransform.mockImplementation(value => value);
      const result = field.transform({ a: 1 });
      expect(Object.getPrototypeOf(result)).toBe(proto);
    });

    it('should transform JSON string to object and transform fields', () => {
      const field = new Schema({
        a: mockValidateField,
      });
      mockedTransform.mockImplementation(value => value);
      const result = field.transform('{"a": 5}');
      expect(result).toEqual({ a: 5 });
    });
  });
});
