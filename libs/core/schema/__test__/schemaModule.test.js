import { beforeEach, describe, it, expect } from '@jest/globals';
import { SchemaModule } from '../schemaModule.js';

describe('SchemaModule', () => {
  const simpleSchema = { name: 'string', age: 'number?' };
  const schemaWithArray = { tags: ['string'] };
  const schemaWithObject = { address: { street: 'string', number: 'number' } };
  const schemaWithReference = { friend: '@simpleSchema', likes: 'number?' };

  let schemaModule;

  beforeEach(() => {
    schemaModule = new SchemaModule();
    schemaModule.registerSchema('simpleSchema', simpleSchema);
    schemaModule.registerSchema('arraySchema', schemaWithArray);
    schemaModule.registerSchema('objectSchema', schemaWithObject);
    schemaModule.registerSchema('referenceSchema', schemaWithReference);
  });

  it('Simple schema', () => {
    expect(schemaModule.validateValue('simpleSchema', { name: 'John', age: 30 })).toBeTruthy();
    expect(schemaModule.validateValue('simpleSchema', { name: 'John' })).toBeTruthy();

    expect(schemaModule.validateValue('simpleSchema', { age: 30 })).toBeFalsy();
    expect(schemaModule.validateValue('simpleSchema', {})).toBeFalsy();
    expect(schemaModule.validateValue('simpleSchema', 0)).toBeFalsy();
  });

  // it('Simple schema', () => {
  //   const { check } = schemaModule.registry.get("simpleSchema");
  //
  //   expect(check({ name: 'John', age: 30 })).toBeTruthy();
  //   expect(check({ tags: ['tag1', 'tag2', 'tag3'] })).toBeTruthy();
  //   expect(check({ address: { street: 'White street', number: 1 } })).toBeTruthy();
  //   expect(check({ likes: 100, friend: { name: 'Petr', age: 25 } })).toBeTruthy();
  // });
});
