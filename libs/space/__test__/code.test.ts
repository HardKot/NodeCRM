import { Code, CodeType, CodeError } from '../code';

describe('Code', () => {
  it('type detection', () => {
    const codeCJS = new Code('', 'module.js');
    const codeESM = new Code('', 'module.mjs');
    const codeTS = new Code('', 'module.ts');

    expect(codeCJS.type).toBe(CodeType.COMMONJS);
    expect(codeESM.type).toBe(CodeType.ESM);
    expect(codeTS.type).toBe(CodeType.TS);
  });

  it('Load CommonJS module', async () => {
    const code = new Code<{ value: number; foo(): string }>(
      `'use strict';

        module.exports = {
          value: 42,
          foo: function() {
            return 'bar';
          }
        };
      `,
      'testModule.cjs'
    );
    await code.load();

    expect(code.exports?.value).toBe(42);
    expect(code.exports?.foo()).toBe('bar');
  });

  it('Load TS module commonJS', async () => {
    const code = new Code<{ value: number; foo(): string }>(
      `
        const value: number = 42;
        function foo(): string {
          return 'bar';
        }
        
        exports.value = value;
        exports.foo = foo;
        `,
      'testModule.ts'
    );
    await code.load();

    expect(code.exports?.value).toBe(42);
    expect(code.exports?.foo()).toBe('bar');
  });

  it('Load ESM module', async () => {
    const code = new Code<{ value: number; foo(): string }>(
      `      
        export const value = 42;
        export function foo() {
          return 'bar';
        }
      `,
      'testModule.mjs'
    );

    await code.load();

    expect(code.exports?.value).toBe(42);
    expect(code.exports?.foo()).toBe('bar');
  });

  it('Inject value into context', async () => {
    const ctx = { injectedValue: 100 };
    const code = new Code<{ getInjectedValue(): number }>(
      `
        exports.getInjectedValue = function() {
          return injectedValue;
        }
      `,
      'testModuleInject.cjs',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      ctx
    );

    await code.load();
    expect(code.exports?.getInjectedValue()).toBe(100);
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
      'testModuleImport.cjs',
      undefined,
      mockRequire
    );
    await code.load();

    expect(mockRequire).toHaveBeenCalledWith('fs');
    expect(mockRequire).toHaveBeenCalledWith('path');
  });

  it('Import module in ESM', async () => {
    const mockRequire = jest.fn().mockImplementation(it => import(it));

    const code = new Code(
      `
        import * as fs from 'fs';
        import * as path from 'path'; 
       
        export  { fs, path };
      `,
      'testModuleImport.mjs',
      undefined,
      mockRequire
    );
    await code.load();
    expect(mockRequire).toHaveBeenCalledWith('fs');
    expect(mockRequire).toHaveBeenCalledWith('path');
  });
});
