import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import path from 'node:path';
import { CODE_TYPE } from '../code.js';

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
const { Instance } = await import('../instance.js');

describe('instance', () => {
  let files;

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

    fs.watch.mockImplementation(() => {});

    fsp.watch.mockImplementation(() => {
      return {
        [Symbol.asyncIterator]() {
          return {
            async next() {
              return new Promise(() => {});
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
        providers: [AppService],
        consumers: [],
        imports: [],
      };
    `;

    const instance = await Instance.run({
      path: '/app',
      stdout: process.stdout,
      stderr: process.stderr,
      moduleType: CODE_TYPE.COMMONJS,
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
        providers: [ExtraService],
        consumers: [],
        imports: [],
      };
    `;

    files['/app/app.module.js'] = `'use strict';
      const { AppService } = require('./app.service');
      const ExtraModule = require('./extra.module');
        
      module.exports = {
        providers: [AppService],
        consumers: [],
        imports: [ExtraModule],
      };
    `;

    const instance = await Instance.run({
      path: '/app',
      stdout: process.stdout,
      stderr: process.stderr,
      moduleType: CODE_TYPE.COMMONJS,
    });

    expect(instance).toBeInstanceOf(Instance);
  });

  it('run execute handler', async () => {
    files['/app/test.controller.js'] = `'use strict';
      function testHandler({ body, params, session }) {
        return { message: 'Hello, ' + body.name };
      }
      testHandler.body = { name: 'string' };
      testHandler.returns = { message: 'string' };
      testHandler.access = 'public';
      
      module.exports = { testHandler };
    `;

    files['/app/app.module.js'] = `'use strict';
      const { testHandler } = require('./test.controller');
      
      module.exports = {
        providers: [],
        consumers: [testHandler],
        imports: [],
      };
    `;

    const instance = await Instance.run({
      path: '/app',
      stdout: process.stdout,
      stderr: process.stderr,
      moduleType: CODE_TYPE.COMMONJS,
    });

    const result = await instance.execute('testHandler', { name: 'World' });
    expect(result.isSuccess).toBe(true);
    expect(result.getOrElse({})).toEqual({ message: 'Hello, World' });
  });

  it('run execute handler class', async () => {
    files['/app/test.controller.js'] = `'use strict';
      class TestController {
        static body = { name: 'string' }; 
        static returns = { message: 'string' };
        static access = 'public';
        
        
        get({ body, params, session }) {
          return { message: 'Hello, ' + body.name };
        }
      }
      
      module.exports = { TestController };
    `;

    files['/app/app.module.js'] = `'use strict';
      const { TestController } = require('./test.controller');
      
      module.exports = {
        providers: [],
        consumers: [TestController],
        imports: [],
      };
    `;

    const instance = await Instance.run({
      path: '/app',
      stdout: process.stdout,
      stderr: process.stderr,
      moduleType: CODE_TYPE.COMMONJS,
    });

    const result = await instance.execute('TestController.get', { name: 'World' });
    expect(result.isSuccess).toBe(true);
    expect(result.getOrElse({})).toEqual({ message: 'Hello, World' });
  });

  it('save change session', async () => {
    files['/app/test.controller.js'] = `'use strict';
      function testHandler({ body, params, session }) {
        session.set('id', 1);
      
        return { message: 'Hello, ' + session.get('name') };
      }
      testHandler.returns = { message: 'string' };
      testHandler.access = 'public';
      
      module.exports = { testHandler };
    `;

    files['/app/app.module.js'] = `'use strict';
      const { testHandler } = require('./test.controller');
      
      module.exports = {
        providers: [],
        consumers: [testHandler],
        imports: [],
      };
    `;

    const instance = await Instance.run({
      path: '/app',
      stdout: process.stdout,
      stderr: process.stderr,
      moduleType: CODE_TYPE.COMMONJS,
    });

    const session = new Map([['name', 'World']]);
    const result = await instance.execute('testHandler', null, session);
    expect(result.isSuccess).toBe(true);
    expect(result.getOrElse({})).toEqual({ message: 'Hello, World' });
    expect(session.get('id')).toEqual(1);
  });
});
