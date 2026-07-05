import { it, describe } from 'node:test';
import assert from 'node:assert';
import { Schema } from '../../schema/schema.js';
import { ScalarType } from '../enums.js';

describe('Schema', () => {
  describe('Scalar schema', () => {
    const stringScalar = new Schema.Scalar({ scalar: ScalarType.String, require: true });
    const intScalar = new Schema.Scalar({ scalar: ScalarType.Int, require: true });
    const booleanScalar = new Schema.Scalar({ scalar: ScalarType.Boolean, require: true });
    const numberScalar = new Schema.Scalar({ scalar: ScalarType.Number, require: true });
    const textScalar = new Schema.Scalar({ scalar: ScalarType.Text, require: true });

    describe('Validate scalar', () => {
      it("Success validate 'string'", () => {
        it.expect(stringScalar.validate('')).isSuccessResult();
        assert.strictEqual(stringScalar.validate('').isSuccess, true);
      });

      it("Success validate 'int'", () => {
        assert.strictEqual(intScalar.validate(1).isSuccess, true);
        assert.strictEqual(intScalar.validate(-1).isSuccess, true);
        assert.strictEqual(intScalar.validate(0).isSuccess, true);
      });

      it("Failure validate 'string'", () => {
        assert.strictEqual(stringScalar.validate().isSuccess, false);
        assert.strictEqual(stringScalar.validate(1).isSuccess, false);
        assert.strictEqual(stringScalar.validate(false).isSuccess, false);
        assert.strictEqual(stringScalar.validate(null).isSuccess, false);
        assert.strictEqual(stringScalar.validate('\n').isSuccess, false);
      });

      it("Failure validate 'int'", () => {
        assert.strictEqual(intScalar.validate().isSuccess, false);
        assert.strictEqual(intScalar.validate(1.1).isSuccess, false);
        assert.strictEqual(intScalar.validate('').isSuccess, false);
        assert.strictEqual(intScalar.validate(false).isSuccess, false);
        assert.strictEqual(intScalar.validate(null).isSuccess, false);
      });
    });
  });
});
