import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import path from 'node:path';

const fsMock = {
  readdirSync: jest.fn(),
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  statSync: jest.fn(),
  watch: jest.fn(),
};
fsMock.default = fsMock;

const fsMockPromise = {
  readdir: jest.fn(),
  stat: jest.fn(),
  readFile: jest.fn(),
  watch: jest.fn(),
};

fsMockPromise.default = fsMockPromise;

jest.unstable_mockModule('node:fs', () => fsMock);
jest.unstable_mockModule('node:fs/promises', () => fsMockPromise);

const fs = await import('node:fs');
const fsp = await import('node:fs/promises');
const { Space } = await import('../space.js');

describe('Space', () => {
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

  it('loads one module', async () => {
    files['/app/app.module.js'] = 'module.exports = class RootModule {};';

    const space = await Space.load({ path: '/app' });

    const module = space.get('app.module');

    expect(module.name).toBe('RootModule');
  });

  it('loads module with dependency', async () => {
    files['/app/app.module.js'] = `'use strict';
      const Service = require("./app.service"); 
      const Controller = require("./app.controller"); 
      
      module.exports = class RootModule { 
        static services = [Service];
        static controllers = [Controller];
      };
      `;
    files['/app/app.controller.js'] = `'use strict';
      const Service = require("./app.service"); 
      module.exports = class RootController { 
        constructor() {
          this.service = new Service();
        }
      
        all() {
          return this.service.getAll();
        }
      };
      `;

    files['/app/app.service.js'] = `'use strict';
      const arr = [1, 2, 3];
    
      module.exports = class RootService { 
        getAll() {
          return arr;
        }
      };
      `;

    const space = await Space.load({ path: '/app' });
    const module = space.get('app');

    const service = new module.services[0]();
    const controller = new module.controllers[0]();

    expect(service.getAll() === controller.all()).toBeTruthy();
  });

  it('loads many modules', async () => {
    files['/app/app.module.js'] = `'use strict';
      module.exports = class AppModule { 
      };
      `;
    files['/app/beta.module.js'] = `'use strict';
      module.exports = class BetaModule { 
        all() {
          return this.service.getAll();
        }
      };
      `;

    const space = await Space.load({ path: '/app' });

    expect(space.get('app').name).toBe('AppModule');
    expect(space.get('beta').name).toBe('BetaModule');
  });

  it('reloads modules on change', async () => {
    files['/app/app.module.js'] = `'use strict'
      const Service = require("./app.service");
      
      module.exports = class AppModule {
        static services = [Service];
      }
    `;

    files['/app/app.service.js'] = `'use strict'
      module.exports = class AppService {
        getAll() {
          return [1, 2, 3];
        }
      }
    `;

    const space = await Space.watch({ path: '/app' });
    let service = space.get('app').services[0];
    expect(service.name).toBe('AppService');

    space.onChange(() => {
      service = space.get('app').services[0];
      expect(service.name).toBe('NewAppService');
    });

    files['/app/app.service.js'] = `'use strict'
      module.exports = class NewAppService {
        getAll() {
          return [3, 2, 1];
        }
      }
    `;
    watchCallback();
  });
});
