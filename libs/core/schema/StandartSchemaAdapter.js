import { Transform } from './transformUtils.js';

class StandardSchemaAdapter {
  get(type, options) {
    return Transform[type] ?? Transform.auto;
  }

  wrapObject(schema) {
    return;
  }
}

export { StandardSchemaAdapter };
