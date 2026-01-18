import { describe, it, expect } from '@jest/globals';
import { ScalarField } from '../scalarField.js';

describe('ScalarField check', () => {
  it('should validate correct type for required field', () => {
    const field = new ScalarField('number', true);
    const result = field.check(42);
    expect(result.valid).toBe(true);
  });

  it('should invalidate incorrect type for required field', () => {
    const field = new ScalarField('string', true);
    const result = field.check(42);
    expect(result.valid).toBe(false);
  });

  it('should allow undefined for non-required field', () => {
    const field = new ScalarField('boolean', false);
    const result = field.check(undefined);
    expect(result.valid).toBe(true);
  });

  it('should invalidate undefined for required field', () => {
    const field = new ScalarField('number', true);
    const result = field.check(undefined);
    expect(result.valid).toBe(false);
  });
});

describe('ScalarField transform', () => {
  it('should transform string to String object', () => {
    const field = new ScalarField('string', true);
    const result = field.transform('hello');
    expect(typeof result).toBe('string');
    expect(result.valueOf()).toBe('hello');
  });

  it('should transform number to Number object', () => {
    const field = new ScalarField('number', true);
    const result = field.transform(123);
    expect(typeof result).toBe('number');
    expect(result.valueOf()).toBe(123);
  });

  it('should transform boolean to Boolean object', () => {
    const field = new ScalarField('boolean', true);
    const result = field.transform(true);
    expect(typeof result).toBe('boolean');
    expect(result.valueOf()).toBe(true);
  });

  it('should return undefined for undefined input', () => {
    const field = new ScalarField('string', false);
    const result = field.transform(undefined);
    expect(result).toBeUndefined();
  });
});
