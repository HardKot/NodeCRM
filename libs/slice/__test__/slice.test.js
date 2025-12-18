import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const fsMock = {
  readdirSync: jest.fn(),
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  statSync: jest.fn(),
};
fsMock.default = fsMock;

jest.unstable_mockModule('node:fs', () => fsMock);
const fs = await import('node:fs');
const { Slice } = await import('../slice.js');

describe('Slice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Load modules', async () => {
    const mockFiles = {
      '/app/module.service.js': `'use strict'; module.exports = { value: 1 };`,
      '/app/module.controller.js': `'use strict'; module.exports = { value: 2 };`,
    };

    fs.readdirSync.mockImplementation(() => [
      {
        name: 'module.service.js',
        isFile: () => true,
        isDirectory: () => false,
      },
      {
        name: 'module.controller.js',
        isFile: () => true,
        isDirectory: () => false,
      },
    ]);
    fs.statSync.mockImplementation(() => ({
      isFile: () => false,
    }));
    fs.existsSync.mockImplementation(path => !!mockFiles[path]);
    fs.readFileSync.mockImplementation(path => mockFiles[path]);
    const slice = new Slice({ path: '/app' });

    const codes = await slice.load();

    expect(codes['/app/module.service.js'].exports.value).toBe(1);
    expect(codes['/app/module.controller.js'].exports.value).toBe(2);
  });

  it('Load modules from multiple directories', async () => {
    const mockFiles = {
      '/app/services/module.service.js': `'use strict'; module.exports = { value: 1 };`,
      '/app/api/module.controller.js': `'use strict'; module.exports = { value: 2 };`,
    };

    fs.readdirSync.mockImplementation(it => {
      if (it.includes('services'))
        return [
          {
            name: 'module.service.js',
            isFile: () => true,
            isDirectory: () => false,
          },
        ];
      if (it.includes('api'))
        return [
          {
            name: 'module.controller.js',
            isFile: () => true,
            isDirectory: () => false,
          },
        ];
      return [];
    });

    fs.statSync.mockImplementation(() => ({
      isFile: () => false,
    }));
    fs.existsSync.mockImplementation(path => !!mockFiles[path]);
    fs.readFileSync.mockImplementation(path => mockFiles[path]);
    const slice = new Slice({ path: '/app' }, { path: ['./services', './api'] });

    const codes = await slice.load();

    expect(codes['/app/services/module.service.js'].exports.value).toBe(1);
    expect(codes['/app/api/module.controller.js'].exports.value).toBe(2);
  });

  it('Handles empty directory', async () => {
    fs.readdirSync.mockImplementation(() => []);
    fs.statSync.mockImplementation(() => ({
      isFile: () => false,
    }));
    const slice = new Slice({ path: '/empty' });

    const codes = await slice.load();
    expect(Object.keys(codes).length).toBe(0);
  });

  it('Skips non-JS/TS files', async () => {
    fs.readdirSync.mockImplementation(() => [
      {
        name: 'readme.md',
        isFile: () => true,
        isDirectory: () => false,
      },
      {
        name: 'script.py',
        isFile: () => true,
        isDirectory: () => false,
      },
    ]);
    fs.statSync.mockImplementation(() => ({
      isFile: () => false,
    }));
    const slice = new Slice({ path: '/mixed' });

    const codes = await slice.load();
    expect(Object.keys(codes).length).toBe(0);
  });

  it('Returns null for non-existent files', async () => {
    fs.existsSync.mockImplementation(() => false);
    const slice = new Slice({ path: '/nonexistent' });

    const code = slice.loadCode('/nonexistent/missing.js');

    expect(code).toBeNull();
  });

  it('Require localModule', async () => {
    const mockFiles = {
      '/app/module.util.js': `'use strict'; module.exports = { value: 3 };`,
      '/app/module.service.js': `
        'use strict'; 
        const utils = require('./module.util.js')
        
        module.exports = { 
          getValue: function() { return utils.value; }, 
          utils,
        };`,
    };

    fs.readdirSync.mockImplementation(() => [
      {
        name: 'module.util.js',
        isFile: () => true,
        isDirectory: () => false,
      },
      {
        name: 'module.service.js',
        isFile: () => true,
        isDirectory: () => false,
      },
    ]);

    fs.existsSync.mockImplementation(path => !!mockFiles[path]);
    fs.readFileSync.mockImplementation(path => mockFiles[path]);

    const slice = new Slice({ path: '/app' });
    const codes = await slice.load();

    expect(codes['/app/module.service.js'].exports.getValue()).toBe(3);
    expect(
      codes['/app/module.service.js'].exports.utils === codes['/app/module.util.js'].exports
    ).toBeTruthy();
  });
});
