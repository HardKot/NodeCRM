import { describe, it, expect, jest, beforeEach } from '@jest/globals';

import { CheckResult } from '../checkResult.js';

describe('CheckResult', () => {
  it('should create a valid CheckResult without errors', () => {
    const result = new CheckResult(true);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('should create an invalid CheckResult with errors', () => {
    const errors = ['Error 1', 'Error 2'];
    const result = new CheckResult(false, errors);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([
      { path: '', message: 'Error 1' },
      { path: '', message: 'Error 2' },
    ]);
  });

  it('should add an error message', () => {
    const result = new CheckResult(true);
    result.addError('New Error', 'path.to.field');
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([{ path: 'path.to.field', message: 'New Error' }]);
  });

  it('should add errors from another CheckResult', () => {
    const result1 = new CheckResult(true);
    const result2 = new CheckResult(false, ['Error A', 'Error B']);
    result1.addError(result2, 'parent.path');
    expect(result1.valid).toBe(false);
    expect(result1.errors).toEqual([
      { path: 'parent.path', message: 'Error A' },
      { path: 'parent.path', message: 'Error B' },
    ]);
  });
});
