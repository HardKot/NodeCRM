import path from 'node:path';

import { describe, beforeEach, test, expect } from '@jest/globals';
import { AppModuleLoader } from '../appModuleLoader';

describe('AppModuleLoader', () => {
  let moduleLoader;
  let moduleDirPath = path.join(import.meta.dirname, 'module');

  beforeEach(() => {
    moduleLoader = new AppModuleLoader({
      path: moduleDirPath,
    });
  });

  test('Success load modules', async () => {
    await moduleLoader.load();

    console.log(moduleLoader);
    expect(moduleLoader.modules[path.join(moduleDirPath, 'aModule.js')]).toBeDefined();
    expect(moduleLoader.modules[path.join(moduleDirPath, 'bModule.js')]).toBeDefined();
  });

  test('Not load hidden files', async () => {
    await moduleLoader.load();

    expect(moduleLoader.modules[path.join(moduleDirPath, '_cModule.js')]).not.toBeDefined();
  });
});
