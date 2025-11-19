import { beforeEach, describe, it, expect } from '@jest/globals';
import { SchemaModule } from '../schemaModule.js';

describe('SchemaModule', () => {
  const simpleSchema = { name: 'string', age: 'number?' };
  const schemaWithArray = { tags: ['string'] };
  const schemaWithObject = { address: { street: 'string', number: 'number' } };

  let schemaModule;

  beforeEach(() => {
    schemaModule = new SchemaModule();
    schemaModule.registerSchema('simpleSchema', simpleSchema);
    schemaModule.registerSchema('arraySchema', schemaWithArray);
    schemaModule.registerSchema('objectSchema', schemaWithObject);
  });

  it('validate simple schema', () => {
    const validator = schemaModule.createValidator('simpleSchema');

    expect(validator({ name: 'John', age: 30 }).valid).toBeTruthy();
    expect(validator({ name: 'John' }).valid).toBeTruthy();

    expect(validator({ age: 30 }).valid).toBeFalsy();
    expect(validator({}).valid).toBeFalsy();
    expect(validator(0).valid).toBeFalsy();
  });

  it('validate schema array', () => {
    const validator = schemaModule.createValidator('arraySchema');

    expect(validator({ tags: ['tag1', 'tag2', 'tag3'] }).valid).toBeTruthy();
    expect(validator({ tags: [1, 2, 3] }).valid).toBeFalsy();
    expect(validator({ tags: [['tag1', 'tag2', 'tag3']] }).valid).toBeFalsy();
    expect(validator({ tags: { 0: 'tag1', 1: 'tag2' } }).valid).toBeFalsy();
    expect(validator({ tags: 'tag1,tag2,tag3' }).valid).toBeFalsy();
  });

  it('validate schema object', () => {
    const validator = schemaModule.createValidator('objectSchema');

    expect(validator({ address: { street: 'Test', number: 12 } }).valid).toBeTruthy();
    expect(
      validator({
        address: [
          ['street', 'Test'],
          ['number', 12],
        ],
      }).valid
    ).toBeFalsy();
    expect(validator({ address: ['street', 'Test', 'number', 12] }).valid).toBeFalsy();
    expect(validator({ address: [{ street: 'Test', number: 12 }] }).valid).toBeFalsy();
  });
});
