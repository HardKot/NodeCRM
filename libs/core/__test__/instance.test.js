import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import path from 'node:path';

jest.unstable_mockModule('node:fs', () => {
  const fsMock = {
    readdirSync: jest.fn(),
    existsSync: jest.fn(),
    readFileSync: jest.fn(),
    statSync: jest.fn(),
    watch: jest.fn(),
  };
  fsMock.default = fsMock;
  return fsMock;
});
jest.unstable_mockModule('node:fs/promises', () => {
  const fsMockPromise = {
    readdir: jest.fn(),
    stat: jest.fn(),
    readFile: jest.fn(),
    watch: jest.fn(),
  };

  fsMockPromise.default = fsMockPromise;
  return fsMockPromise;
});
jest.unstable_mockModule('node:cluster', () => {
  const mock = {
    isWorker: true,
    worker: { id: 1 },
    fork: jest.fn(() => ({ process: { pid: 1234 } })),
  };
  mock.default = mock;
  return mock;
});

const fs = await import('node:fs');
const fsp = await import('node:fs/promises');
const cluster = await import('node:cluster');
const { Instance } = await import('../instance.js');

describe('instance', () => {
  let files;
  let watchCallback;

  beforeEach(() => {
    jest.clearAllMocks();
    files = {};

    fs.existsSync.mockImplementation(it => files.hasOwnProperty(it));
    fs.readdirSync.mockImplementation(() => {
      return Object.keys(files)
        .map(it => path.parse(it))
        .map(it => ({
          name: it.base,
          parent: it.dir,
          isFile: () => true,
          isDirectory: () => false,
        }));
    });
    fs.readFileSync.mockImplementation(it => files[it]);

    fsp.readdir.mockImplementation(() => {
      return Promise.resolve(
        Object.keys(files)
          .map(it => path.parse(it))
          .map(it => ({
            name: it.base,
            parent: it.dir,
            isFile: () => true,
            isDirectory: () => false,
          }))
      );
    });

    fsp.readFile.mockImplementation(it => {
      return Promise.resolve(files[it]);
    });

    fs.watch.mockImplementation((path, options, callback) => {
      watchCallback = callback;
    });

    fsp.watch.mockImplementation(() => {
      return {
        [Symbol.asyncIterator]() {
          return {
            async next() {
              return new Promise(resolve => {
                watchCallback = () => {
                  resolve({ done: false, value: [] });
                };
              });
            },
          };
        },
      };
    });
  });

  it('load worker instance', async () => {
    files['/app/app.service.js'] = `'use strict';
      class AppService {}
      
      module.exports = { AppService };
    `;

    files['/app/app.module.js'] = `'use strict';
      const { AppService } = require('./app.service');
        
      module.exports = {
        factory: (instance) => {
          return {};
        },
        providers: () => [AppService],
        controllers: () => [],
        imports: [],
      };
    `;

    const instance = await Instance.run({
      path: '/app',
    });

    expect(instance).toBeInstanceOf(Instance);
  });

  it('load module dependency', async () => {
    files['/app/app.service.js'] = `'use strict';
      class AppService {}
      
      module.exports = { AppService };
    `;
    files['/app/extra.service.js'] = `'use strict';
      class ExtraService {}
      module.exports = { ExtraService }
    `;

    files['/app/extra.module.js'] = `'use strict';
      const { ExtraService } = require('./extra.service');
      
      module.exports = {
        providers: () => [ExtraService],
        controllers: () => [],
        imports: [],
      };
    `;

    files['/app/app.module.js'] = `'use strict';
      const { AppService } = require('./app.service');
        
      module.exports = {
        providers: () => [AppService],
        controllers: () => [],
        imports: ['extra.module'],
      };
    `;

    const instance = await Instance.run({
      path: '/app',
    });

    expect(instance).toBeInstanceOf(Instance);
  });
});
