import { beforeEach, describe, it, expect } from '@jest/globals';
import { SchemaModule } from '../schemaModule.js';

describe('SchemaModule', () => {
  const simpleSchema = { name: 'string', age: 'number?' };
  const schemaWithArray = { tags: ['string'] };
  const schemaWithObject = { address: { street: 'string', number: 'number' } };

  let schemaModule;

  beforeEach(() => {
    schemaModule = new SchemaModule();
  });

  it('validate simple schema', () => {
    const schema = schemaModule.factorySchema(simpleSchema);

    expect(schema.validate({ name: 'John', age: 30 }).valid).toBeTruthy();
    expect(schema.validate({ name: 'John' }).valid).toBeTruthy();

    expect(schema.validate({ age: 30 }).valid).toBeFalsy();
    expect(schema.validate({}).valid).toBeFalsy();
    expect(schema.validate(0).valid).toBeFalsy();
  });

  it('validate schema array', () => {
    const schema = schemaModule.factorySchema(schemaWithArray);

    expect(schema.validate({ tags: ['tag1', 'tag2', 'tag3'] }).valid).toBeTruthy();
    expect(schema.validate({ tags: [1, 2, 3] }).valid).toBeFalsy();
    expect(schema.validate({ tags: [['tag1', 'tag2', 'tag3']] }).valid).toBeFalsy();
    expect(schema.validate({ tags: { 0: 'tag1', 1: 'tag2' } }).valid).toBeFalsy();
    expect(schema.validate({ tags: 'tag1,tag2,tag3' }).valid).toBeFalsy();
  });

  it('validate schema object', () => {
    const schema = schemaModule.factorySchema(schemaWithObject);

    expect(schema.validate({ address: { street: 'Test', number: 12 } }).valid).toBeTruthy();
    expect(
      schema.validate({
        address: [
          ['street', 'Test'],
          ['number', 12],
        ],
      }).valid
    ).toBeFalsy();
    expect(schema.validate({ address: ['street', 'Test', 'number', 12] }).valid).toBeFalsy();
    expect(schema.validate({ address: [{ street: 'Test', number: 12 }] }).valid).toBeFalsy();
  });
});
