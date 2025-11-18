import path from 'node:path';

import { describe, beforeEach, test, expect } from '@jest/globals';

import { AppModule, AppModuleError } from '../appModule.js';

describe('AppModule', () => {
  // let aModule;
  // let dModule;
  //
  // beforeEach(() => {
  //   aModule = new AppModule('aModule.js', { dirname: path.join(import.meta.dirname, 'module') });
  // });
  //
  // test('loading module', async () => {
  //   expect(await aModule.load()).toBeDefined();
  // });
  //
  // test('not found module', async () => {
  //   dModule = new AppModule('dModule.js', { dirname: path.join(import.meta.dirname, 'module') });
  //   return expect(dModule.load()).rejects.toThrow(AppModuleError);
  // });
});
