const path = require('node:path');

jest.mock('node:fs');
jest.mock('node:fs/promises', () => jest.requireMock('node:fs').promise);

const fs = require('node:fs');
const { VirtualSpace } = require('../virtualSpace.js');

describe('VirtualSpace', () => {
  let files;
  let watchCallback;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads one module', async () => {
    fs.__setMockFiles({
      '/app/app.module.js': 'module.exports = class RootModule {};',
    });

    const space = await VirtualSpace.load({ path: '/app' });

    const module = space.get('app.module');

    expect(module.name).toBe('RootModule');
  });

  it('loads module with dependency', async () => {
    fs.__setMockFiles({
      '/app/app.module.js': `'use strict';
      const Service = require("./app.service"); 
      const Controller = require("./app.controller"); 
      
      module.exports = class RootModule { 
        static services = [Service];
        static controllers = [Controller];
      };
      `,
      '/app/app.controller.js': `'use strict';
      const Service = require("./app.service"); 
      module.exports = class RootController { 
        constructor() {
          this.service = new Service();
        }
      
        all() {
          return this.service.getAll();
        }
      };
      `,

      '/app/app.service.js': `'use strict';
      const arr = [1, 2, 3];
    
      module.exports = class RootService { 
        getAll() {
          return arr;
        }
      };
      `,
    });

    const space = await VirtualSpace.load({ path: '/app' });
    const module = space.get('app');

    const service = new module.services[0]();
    const controller = new module.controllers[0]();

    expect(service.getAll() === controller.all()).toBeTruthy();
  });

  it('loads many modules', async () => {
    fs.__setMockFiles({
      '/app/app.module.js': `'use strict';
      module.exports = class AppModule { 
      };
      `,
      '/app/beta.module.js': `'use strict';
      module.exports = class BetaModule { 
        all() {
          return this.service.getAll();
        }
      };
      `,
    });

    const space = await VirtualSpace.load({ path: '/app' });

    expect(space.get('app').name).toBe('AppModule');
    expect(space.get('beta').name).toBe('BetaModule');
  });

  it('reloads modules on change', async () => {
    fs.__setMockFiles({
      '/app/app.module.js': `'use strict'
      const Service = require("./app.service");
      
      module.exports = class AppModule {
        static services = [Service];
      }
    `,

      '/app/app.service.js': `'use strict'
      module.exports = class AppService {
        getAll() {
          return [1, 2, 3];
        }
      }
    `,
    });

    const space = await VirtualSpace.watch({ path: '/app' });
    let service = space.get('app').services[0];
    expect(service.name).toBe('AppService');

    space.onChange(() => {
      service = space.get('app').services[0];
      expect(service.name).toBe('NewAppService');
    });

    fs.__setMockFile({
      '/app/app.service.js': `'use strict'
      module.exports = class NewAppService {
        getAll() {
          return [3, 2, 1];
        }
      }
    `,
    });
    fs.__runWatchCallback();
  });
});
