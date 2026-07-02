import { test } from 'node:test';
import assert from 'node:assert';
import { syncBuiltinESMExports } from 'node:module';

import { Types } from './types.js';
import { Result } from './result.js';

class Expected {
  #value;
  constructor(value) {
    this.#value = value;
  }

  isSuccessResult() {
    assert(Types.isInstanceOf(this.#value, Result), 'Value is not Result');
    assert(this.#value.isSuccess, 'Value is not success');
  }
}

test.expect = v => new Expected(v);

// syncBuiltinESMExports();
