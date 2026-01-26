const { Code, CODE_TYPE, CodeError } = require('../code.js');

describe('Code', () => {
  it('type detection', () => {
    const codeCJS = new Code('', { name: 'module.js' });
    const codeESM = new Code('', { name: 'module.mjs' });
    const codeTS = new Code('', { name: 'module.ts' });

    expect(codeCJS.type).toBe(CODE_TYPE.COMMONJS);
    expect(codeESM.type).toBe(CODE_TYPE.ESM);
    expect(codeTS.type).toBe(CODE_TYPE.TS);
  });

  it('Load CommonJS module', async () => {
    const code = new Code(
      `'use strict';
        
        module.exports = {
          value: 42,
          foo: function() {
            return 'bar';
          }
        };
      `,
      { name: 'testModule.cjs' }
    );
    await code.autoLoad();

    expect(code.exports.value).toBe(42);
    expect(code.exports.foo()).toBe('bar');
  });

  it('Load ESM module', async () => {
    const code = new Code(
      `
        export const value = 42;
        export function foo() {
          return 'bar';
        }
      `,
      { name: 'testModule.mjs' }
    );

    await code.autoLoad();

    expect(code.exports.value).toBe(42);
    expect(code.exports.foo()).toBe('bar');
  });

  it('Load TS module', async () => {
    const code = new Code(
      `
        export const value: number = 42;
        export function foo(): string {
          return 'bar';
        }`,
      { name: 'testModule.ts' }
    );
    await code.autoLoad();

    expect(code.exports.value).toBe(42);
    expect(code.exports.foo()).toBe('bar');
  });

  it('Inject value into context', async () => {
    const ctx = { injectedValue: 100 };
    const code = new Code(
      `
        module.exports = {
          getInjectedValue: function() {
            return injectedValue;
          }
        };
      `,
      { name: 'testModuleInject.cjs', context: ctx }
    );

    await code.autoLoad();
    expect(code.exports.getInjectedValue()).toBe(100);
  });

  it('Import module in CommonJS', async () => {
    const mockRequire = jest.fn().mockReturnValue({});

    const code = new Code(
      `
        const fs = require('fs');
        const path = require('path');
        
        module.exports = {
          fs,
          path
        };
      `,
      { name: 'testModuleImport.cjs', createRequire: () => mockRequire }
    );
    await code.autoLoad();

    expect(mockRequire).toHaveBeenCalledWith('fs');
    expect(mockRequire).toHaveBeenCalledWith('path');
  });
});
