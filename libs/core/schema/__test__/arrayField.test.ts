import { ArrayField } from '../arrayField';
import { TestBaseField } from './testBaseField';
import { Result } from '../../../utils';
import { ValidateError } from '../fieldError';
import { BaseField } from '../baseField';

describe('ArrayField', () => {
  let mockValidateField: BaseField;
  const mockedValidateType = jest.fn();
  const mockedTransform = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockValidateField = new TestBaseField(mockedValidateType, mockedTransform);
  });

  describe('ArrayField validate type', () => {
    it('should validate array with valid items', () => {
      const field = new ArrayField(mockValidateField);
      mockedValidateType.mockReturnValue(Result.success(null));
      const result = field.validate([1, 2, 3]);
      expect(result.isSuccess).toBe(true);
    });

    it('should invalidate array with invalid items', () => {
      const field = new ArrayField(mockValidateField);
      mockedValidateType.mockReturnValueOnce(Result.failure(new ValidateError('Invalid item')));
      const result = field.validate([1, 2, 3]);
      expect(result.isSuccess).toBe(false);
    });

    it('should invalidate non-array values', () => {
      const field = new ArrayField(mockValidateField);
      const result = field.validate('not an array');
      expect(result.isSuccess).toBe(false);
    });

    it('should call item field check for each item', () => {
      const field = new ArrayField(mockValidateField);
      mockedValidateType.mockReturnValue(Result.success(null));
      field.validate([1, 2, 3]);
      expect(mockedValidateType).toHaveBeenCalledTimes(3);
    });
  });

  describe('ArrayField transform', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should validate array with valid items', () => {
      const field = new ArrayField(mockValidateField);
      mockedTransform.mockImplementation(value => value * 2);
      const result = field.transform([1, 2, 3]);
      expect(result).toEqual([2, 4, 6]);
    });

    it('should parse JSON string and transform items', () => {
      const field = new ArrayField(mockValidateField);
      mockedTransform.mockImplementation(value => value);
      const result = field.transform('[1, 2, 3]');
      expect(result).toEqual([1, 2, 3]);
    });
  });
});
