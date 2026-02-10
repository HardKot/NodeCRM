import { ScalarField, ScalarType } from '../scalarField';

describe('ScalarField', () => {
  describe('ScalarField check', () => {
    it('should validate correct type for required field', () => {
      const field = new ScalarField(ScalarType.Number, true);
      const result = field.validate(42);
      expect(result.isSuccess).toBe(true);
    });

    it('should invalidate incorrect type for required field', () => {
      const field = new ScalarField(ScalarType.String, true);
      const result = field.validate(42);
      expect(result.isSuccess).toBe(false);
    });

    it('should allow undefined for non-required field', () => {
      const field = new ScalarField(ScalarType.Boolean, false);
      const result = field.validate(undefined);
      expect(result.isSuccess).toBe(true);
    });

    it('should invalidate undefined for required field', () => {
      const field = new ScalarField(ScalarType.Number, true);
      const result = field.validate(undefined);
      expect(result.isSuccess).toBe(false);
    });

    it('should validate Int type correctly', () => {
      const field = new ScalarField(ScalarType.Int, true);
      const validResult = field.validate(10);
      const invalidResult = field.validate(10.5);
      expect(validResult.isSuccess).toBe(true);
      expect(invalidResult.isSuccess).toBe(false);
    });
  });

  describe('ScalarField transform', () => {
    it('should transform string to String object', () => {
      const field = new ScalarField(ScalarType.String, true);
      const result = field.transform('hello');
      expect(typeof result).toBe('string');
      expect(result).toBe('hello');
    });

    it('should transform number to Number object', () => {
      const field = new ScalarField(ScalarType.Number, true);
      const result = field.transform(123);
      expect(typeof result).toBe('number');
      expect(result).toBe(123);
    });

    it('should transform boolean to Boolean object', () => {
      const field = new ScalarField(ScalarType.Boolean, true);
      const result = field.transform(true);
      expect(typeof result).toBe('boolean');
      expect(result).toBe(true);
    });

    it('should return undefined for undefined input', () => {
      const field = new ScalarField(ScalarType.String, false);
      const result = field.transform(undefined);
      expect(result).toBeUndefined();
    });

    it('should transform to Int correctly', () => {
      const field = new ScalarField(ScalarType.Int, true);
      const result = field.transform('42.9');
      expect(result).toBe(42);
    });
  });
});
