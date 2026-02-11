import * as path from 'node:path';
import * as fs from 'node:fs';
import { Space } from '../space';

describe('VirtualSpace', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads one module', async () => {
    const space = await Space.factory({
      path: path.join(__dirname, 'commonjs', 'appModule'),
    });

    expect(space.current.name).toBe('AppModule');
  });

  it('loads module with dependency', async () => {
    const space = await Space.factory({
      path: path.join(__dirname, 'commonjs', 'moduleWithDependency'),
    });

    expect(space.current.name).toBe('AppModule');
  });

  it('loads many modules', async () => {
    const space = await Space.factory({
      path: path.join(__dirname, 'commonjs', 'manyModules'),
    });

    expect(space.current.name).toBe('AppModule');
    expect(space.current.components[0].name).toBe('AppServices');
  });

  // it('loads modules with circular', async () => {
  //   const space = await Space.factory({
  //     path: path.join(__dirname, 'commonjs', 'circularDependency'),
  //   });
  //
  //   expect(space.current.name).toBe('AppModule');
  //   expect(space.current.components[0].name).toBe('AppServices');
  // });

  // it('loads module with dependency', async () => {
  //   fs.__setMockFiles({
  //     '/app/app.module.js': `'use strict';
  //     const Service = require("./app.service");
  //     const Controller = require("./app.controller");
  //
  //     module.exports = class RootModule {
  //       static services = [Service];
  //       static controllers = [Controller];
  //     };
  //     `,
  //     '/app/app.controller.js': `'use strict';
  //     const Service = require("./app.service");
  //     module.exports = class RootController {
  //       constructor() {
  //         this.service = new Service();
  //       }
  //
  //       all() {
  //         return this.service.getAll();
  //       }
  //     };
  //     `,
  //
  //     '/app/app.service.js': `'use strict';
  //     const arr = [1, 2, 3];
  //
  //     module.exports = class RootService {
  //       getAll() {
  //         return arr;
  //       }
  //     };
  //     `,
  //   });
  //
  //   const space = await VirtualSpace.factory({ path: '/app' });
  //   const module = space.get('app');
  //
  //   const service = new module.services[0]();
  //   const controller = new module.controllers[0]();
  //
  //   expect(service.getAll() === controller.all()).toBeTruthy();
  // });
  //
  // it('loads many modules', async () => {
  //   fs.__setMockFiles({
  //     '/app/app.module.js': `'use strict';
  //     module.exports = class AppModule {
  //     };
  //     `,
  //     '/app/beta.module.js': `'use strict';
  //     module.exports = class BetaModule {
  //       all() {
  //         return this.service.getAll();
  //       }
  //     };
  //     `,
  //   });
  //
  //   const space = await VirtualSpace.factory({ path: '/app' });
  //
  //   expect(space.get('app').name).toBe('AppModule');
  //   expect(space.get('beta').name).toBe('BetaModule');
  // });
  //
  // it('reloads modules on change', async () => {
  //   fs.__setMockFiles({
  //     '/app/app.module.js': `'use strict'
  //     const Service = require("./app.service");
  //
  //     module.exports = class AppModule {
  //       static services = [Service];
  //     }
  //   `,
  //
  //     '/app/app.service.js': `'use strict'
  //     module.exports = class AppService {
  //       getAll() {
  //         return [1, 2, 3];
  //       }
  //     }
  //   `,
  //   });
  //
  //   const space = await VirtualSpace.factory({ path: '/app' });
  //   let service = space.get('app').services[0];
  //   expect(service.name).toBe('AppService');
  //
  //   space.onChange(() => {
  //     service = space.get('app').services[0];
  //     expect(service.name).toBe('NewAppService');
  //   });
  //
  //   fs.__setMockFile({
  //     '/app/app.service.js': `'use strict'
  //     module.exports = class NewAppService {
  //       getAll() {
  //         return [3, 2, 1];
  //       }
  //     }
  //   `,
  //   });
  //   fs.__runWatchCallback();
  // });
});
