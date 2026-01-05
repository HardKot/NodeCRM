import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import path from 'node:path';

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
  readFile: jest.fn(),
};

fsMockPromise.default = fsMockPromise;

jest.unstable_mockModule('node:fs', () => fsMock);
jest.unstable_mockModule('node:fs/promises', () => fsMockPromise);

const fs = await import('node:fs');
const fsp = await import('node:fs/promises');
const { Space } = await import('../space.js');

describe('Space', () => {
  let space;
  let files;
  const mockLogger = { info: jest.fn(), error: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    files = {};
    space = new Space({ logger: mockLogger, context: {}, path: '/app' });

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
  });

  it('loads one module', async () => {
    files['/app/app.module.js'] = 'module.exports = class RootModule {};';

    await space.load();

    const module = space.modules['app'];

    expect(module.name).toBe('RootModule');
  });

  it('loads module with dependency', async () => {
    files['/app/app.module.js'] = `'use strict';
      const Service = require("./app.service.js"); 
      const Controller = require("./app.controller.js"); 
      
      module.exports = class RootModule { 
        static services = [Service];
        static controllers = [Controller];
      };
      `;
    files['/app/app.controller.js'] = `'use strict';
      const Service = require("./app.service.js"); 
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

    await space.load();

    const module = space.modules['app'];
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

    await space.load();

    expect(space.modules['app'].name).toBe('AppModule');
    expect(space.modules['beta'].name).toBe('BetaModule');
  });
});
