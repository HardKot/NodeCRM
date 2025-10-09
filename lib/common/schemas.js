import * as config from './config.js';

import { MODULE_TYPES, Module } from './Module.js';
import { Flow } from '../flow.js';
import { Schema } from '../schemas/Schema.js';

const SCHEMAS_DIR = config.get('schemas.dir', 'app/schemas');

const SCHEMAS = Flow.of(Module.readDir(SCHEMAS_DIR))
  .filter(it => it.type === MODULE_TYPES.SCRIPT)
  .map(it => it.import())
  .map(it => it.schema || it.default)
  .filter(it => typeof it === 'object')
  .map(it => new Schema(it))
  .map(it => [it.name, it])
  .toMap()
  .get();

Object.freeze(SCHEMAS);

export function getSchema(name) {
  return SCHEMAS.get(name);
}

export function getSchemas() {
  return Array.from(SCHEMAS.values());
}
