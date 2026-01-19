import { describe, it, expect, jest, beforeEach } from '@jest/globals';

import { SchemaField } from '../schemaField.js';
import { BaseField } from '../baseField.js';
import { Result } from '../../../utils/index.js';
import { ValidateError } from '../fieldError.js';

class TestField extends BaseField {
  constructor() {
    super();
    this.check = TestField.__mockCheck;
    this.transform = TestField.__mockTransform;
  }

  static __mockCheck = jest.fn();
  static __mockTransform = jest.fn();
}

describe('SchemaField check', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should validate object with valid fields', () => {
    const field = new SchemaField({
      a: new TestField(),
      b: new TestField(),
    });
    TestField.__mockCheck.mockReturnValue(Result.success());
    const result = field.check({ a: 1, b: 2 });
    expect(result.isSuccess).toBe(true);
  });

  it('should invalidate object with invalid fields', () => {
    const field = new SchemaField({
      a: new TestField(),
      b: new TestField(),
    });
    TestField.__mockCheck.mockReturnValueOnce(Result.failure(new ValidateError('Invalid field')));
    const result = field.check({ a: 1, b: 2 });
    expect(result.isSuccess).toBe(false);
  });

  it('should invalidate non-object values', () => {
    const field = new SchemaField({
      a: new TestField(),
    });
    const result = field.check('not an object');
    expect(result.isSuccess).toBe(false);
  });

  it('should call field check for each schema field', () => {
    const field = new SchemaField({
      a: new TestField(),
      b: new TestField(),
      c: new TestField(),
    });
    TestField.__mockCheck.mockReturnValue(Result.success());
    field.check({ a: 1, b: 2, c: 3 });
    expect(TestField.__mockCheck).toHaveBeenCalledTimes(3);
  });
});

describe('SchemaField transform', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should transform object fields according to schema', () => {
    const field = new SchemaField({
      a: new TestField(),
      b: new TestField(),
    });
    TestField.__mockTransform.mockImplementation(value => value * 2);
    const result = field.transform({ a: 1, b: 2 });
    expect(result).toEqual({ a: 2, b: 4 });
  });
  it('should set the prototype of the transformed object', () => {
    const proto = { customMethod: () => 'hello' };
    const field = new SchemaField(
      {
        a: new TestField(),
      },
      proto
    );
    TestField.__mockTransform.mockImplementation(value => value);
    const result = field.transform({ a: 1 });
    expect(Object.getPrototypeOf(result)).toBe(proto);
  });

  it('should transform JSON string to object and transform fields', () => {
    const field = new SchemaField({
      a: new TestField(),
    });
    TestField.__mockTransform.mockImplementation(value => value);
    const result = field.transform('{"a": 5}');
    expect(result).toEqual({ a: 5 });
  });
});
