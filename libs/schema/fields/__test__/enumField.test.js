import { describe, it, expect } from '@jest/globals';
import { EnumField } from '../enumField.js';

describe('EnumField check', () => {
  it('should validate value in enum', () => {
    const field = new EnumField(['red', 'green', 'blue'], true);
    const result = field.check('green');
    expect(result.isSuccess).toBe(true);
  });

  it('should invalidate value not in enum', () => {
    const field = new EnumField(['red', 'green', 'blue'], true);
    const result = field.check('yellow');
    expect(result.isSuccess).toBe(false);
  });

  it('should allow undefined for non-required field', () => {
    const field = new EnumField(['red', 'green', 'blue'], false);
    const result = field.check(undefined);
    expect(result.isSuccess).toBe(true);
  });

  it('should invalidate undefined for required field', () => {
    const field = new EnumField(['red', 'green', 'blue'], true);
    const result = field.check(undefined);
    expect(result.isSuccess).toBe(false);
  });
});

describe('EnumField transform', () => {
  it('should return the same value if in enum', () => {
    const field = new EnumField(['red', 'green', 'blue'], true);
    const result = field.transform('red');
    expect(result).toBe('red');
  });
  it('should return undefined if value not in enum', () => {
    const field = new EnumField(['red', 'green', 'blue'], true);
    const result = field.transform('yellow');
    expect(result).toBeUndefined();
  });
});
