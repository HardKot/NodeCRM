const path = require('node:path');

jest.mock('node:fs');
jest.mock('node:fs/promises', () => jest.requireMock('node:fs').promise);

const fs = require('node:fs');
const fsp = require('node:fs/promises');
const cluster = require('node:cluster');
const { Instance } = require('../instance.js');

describe('instance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('load worker instance', async () => {
    fs.__setMockFiles({
      '/app/app.service.js': `'use strict';
      class AppService {}
      
      module.exports = { AppService };
    `,

      '/app/app.module.js': `'use strict';
      const { AppService } = require('./app.service');
        
      module.exports = {
        providers: [AppService],
        consumers: [],
        imports: [],
      };
    `,
    });

    const instance = await Instance.run({
      path: '/app',
      stdout: process.stdout,
      stderr: process.stderr,
    });

    expect(instance).toBeInstanceOf(Instance);
  });

  it('load module dependency', async () => {
    fs.__setMockFiles({
      '/app/app.service.js': `'use strict';
      class AppService {}
      
      module.exports = { AppService };
    `,
      '/app/extra.service.js': `'use strict';
      class ExtraService {}
      module.exports = { ExtraService }
    `,

      '/app/extra.module.js': `'use strict';
      const { ExtraService } = require('./extra.service');
      
      module.exports = {
        providers: [ExtraService],
        consumers: [],
        imports: [],
      };
    `,

      '/app/app.module.js': `'use strict';
      const { AppService } = require('./app.service');
      const ExtraModule = require('./extra.module');
        
      module.exports = {
        providers: [AppService],
        consumers: [],
        imports: [ExtraModule],
      };
    `,
    });

    const instance = await Instance.run({
      path: '/app',
      stdout: process.stdout,
      stderr: process.stderr,
    });

    expect(instance).toBeInstanceOf(Instance);
  });

  it('run execute handler', async () => {
    fs.__setMockFiles({
      '/app/test.controller.js': `'use strict';
      function testHandler({ body, params, session }) {
        return { message: 'Hello, ' + body.name };
      }
      testHandler.body = { name: 'string' };
      testHandler.returns = { message: 'string' };
      testHandler.access = 'public';
      
      module.exports = { testHandler };
    `,
      '/app/app.module.js': `'use strict';
      const { testHandler } = require('./test.controller');
      
      module.exports = {
        providers: [],
        consumers: [testHandler],
        imports: [],
      };
    `,
    });

    const instance = await Instance.run({
      path: '/app',
      stdout: process.stdout,
      stderr: process.stderr,
    });

    const result = await instance.execute('testHandler', { name: 'World' });
    expect(result.isSuccess).toBe(true);
    expect(result.getOrElse({})).toEqual({ message: 'Hello, World' });
  });

  it('run execute handler class', async () => {
    fs.__setMockFiles({
      '/app/test.controller.js': `'use strict';
      class TestController {
        static body = { name: 'string' }; 
        static returns = { message: 'string' };
        static access = 'public';
        
        
        get({ body, params, session }) {
          return { message: 'Hello, ' + body.name };
        }
      }
      
      module.exports = { TestController };
    `,
      '/app/app.module.js': `'use strict';
      const { TestController } = require('./test.controller');
      
      module.exports = {
        providers: [],
        consumers: [TestController],
        imports: [],
      };
    `,
    });

    const instance = await Instance.run({
      path: '/app',
      stdout: process.stdout,
      stderr: process.stderr,
    });

    const result = await instance.execute('TestController.get', { name: 'World' });
    expect(result.isSuccess).toBe(true);
    expect(result.getOrElse({})).toEqual({ message: 'Hello, World' });
  });

  it('save change session', async () => {
    fs.__setMockFiles({
      '/app/test.controller.js': `'use strict';
      function testHandler({ body, params, session }) {
        session.set('id', 1);
      
        return { message: 'Hello, ' + session.get('name') };
      }
      testHandler.returns = { message: 'string' };
      testHandler.access = 'public';
      
      module.exports = { testHandler };
    `,
      '/app/app.module.js': `'use strict';
      const { testHandler } = require('./test.controller');
      
      module.exports = {
        providers: [],
        consumers: [testHandler],
        imports: [],
      };
    `,
    });

    const instance = await Instance.run({
      path: '/app',
      stdout: process.stdout,
      stderr: process.stderr,
    });

    const session = new Map([['name', 'World']]);
    const result = await instance.execute('testHandler', null, session);
    expect(result.isSuccess).toBe(true);
    expect(result.getOrElse({})).toEqual({ message: 'Hello, World' });
    expect(session.get('id')).toEqual(1);
  });
});
