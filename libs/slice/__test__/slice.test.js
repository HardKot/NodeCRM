import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const fsMock = {
  readdirSync: jest.fn(),
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  statSync: jest.fn(),
};
fsMock.default = fsMock;

const fsMockPromise = {
  readdir: jest.fn(),
  stat: jest.fn(),
};

fsMockPromise.default = fsMockPromise;

jest.unstable_mockModule('node:fs', () => fsMock);
jest.unstable_mockModule('node:fs/promises', () => fsMockPromise);

const fs = await import('node:fs');
const fsp = await import('node:fs/promises');
const { Slice } = await import('../slice.js');

describe('Slice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Load modules', async () => {
    const mockFiles = {
      '/app/test.module.js': `'use strict'; module.exports = { value: 1 };`,
    };

    fsp.readdir.mockImplementation(() => [
      {
        name: 'test.module.js',
        isFile: () => true,
        isDirectory: () => false,
      },
    ]);
    fs.statSync.mockImplementation(() => ({
      isFile: () => false,
    }));
    fs.existsSync.mockImplementation(path => !!mockFiles[path]);
    fs.readFileSync.mockImplementation(path => mockFiles[path]);
    const slice = new Slice({ appPath: '/app' });

    const codes = await slice.load();

    expect(codes[0].exports.value).toBe(1);
  });

  it('Handles empty directory', async () => {
    fsp.readdir.mockImplementation(() => []);
    fs.statSync.mockImplementation(() => ({
      isFile: () => false,
    }));
    const slice = new Slice({ appPath: '/empty' });

    const codes = await slice.load();
    expect(Object.keys(codes).length).toBe(0);
  });

  it('Skips non-JS/TS files', async () => {
    fsp.readdir.mockImplementation(() => [
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
    const slice = new Slice({ appPath: '/mixed' });

    const codes = await slice.load();
    expect(codes.length).toBe(0);
  });

  it('Returns null for non-existent files', async () => {
    fs.existsSync.mockImplementation(() => false);
    const slice = new Slice({ appPath: '/nonexistent' });

    const code = slice.loadCode('/nonexistent/missing.js');

    expect(code).toBeNull();
  });

  it('Require localModule', async () => {
    const mockFiles = {
      '/app/util.js': `'use strict'; module.exports = { value: 3 };`,
      '/app/test.module.js': `
        'use strict'; 
        const utils = require('./util.js')
        
        module.exports = { 
          getValue: function() { return utils.value; }, 
          utils,
        };`,
    };

    fsp.readdir.mockImplementation(() => [
      {
        name: 'util.js',
        isFile: () => true,
        isDirectory: () => false,
      },
      {
        name: 'test.module.js',
        isFile: () => true,
        isDirectory: () => false,
      },
    ]);

    fs.existsSync.mockImplementation(path => !!mockFiles[path]);
    fs.readFileSync.mockImplementation(path => mockFiles[path]);

    const slice = new Slice({ appPath: '/app' });
    const codes = await slice.load();

    expect(codes[0].exports.getValue()).toBe(3);
  });
});
