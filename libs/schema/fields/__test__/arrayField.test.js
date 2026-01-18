import { describe, it, expect, beforeEach, jest } from '@jest/globals';

import { CheckResult } from '../../checkResult.js';

import { ArrayField } from '../arrayField.js';
import { BaseField } from '../baseField.js';

class TestField extends BaseField {
  constructor() {
    super();
    this.check = TestField.__mockCheck;
    this.transform = TestField.__mockTransform;
  }

  static __mockCheck = jest.fn();
  static __mockTransform = jest.fn();
}

describe('ArrayField check', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should validate array with valid items', () => {
    const field = new ArrayField(new TestField());
    TestField.__mockCheck.mockReturnValue(CheckResult.Truthy);
    const result = field.check([1, 2, 3]);
    expect(result.valid).toBe(true);
  });

  it('should invalidate array with invalid items', () => {
    const field = new ArrayField(new TestField());
    TestField.__mockCheck.mockReturnValueOnce(CheckResult.Falsy);
    const result = field.check([1, 2, 3]);
    expect(result.valid).toBe(false);
  });

  it('should invalidate non-array values', () => {
    const field = new ArrayField(new TestField());
    const result = field.check('not an array');
    expect(result.valid).toBe(false);
  });

  it('should call item field check for each item', () => {
    const field = new ArrayField(new TestField());
    TestField.__mockCheck.mockReturnValue(CheckResult.Truthy);
    field.check([1, 2, 3]);
    expect(TestField.__mockCheck).toHaveBeenCalledTimes(3);
  });
});

describe('ArrayField transform', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should validate array with valid items', () => {
    const field = new ArrayField(new TestField());
    TestField.__mockTransform.mockImplementation(value => value * 2);
    const result = field.transform([1, 2, 3]);
    expect(result).toEqual([2, 4, 6]);
  });

  it('should parse JSON string and transform items', () => {
    const field = new ArrayField(new TestField());
    TestField.__mockTransform.mockImplementation(value => value);
    const result = field.transform('[1, 2, 3]');
    expect(result).toEqual([1, 2, 3]);
  });
});
