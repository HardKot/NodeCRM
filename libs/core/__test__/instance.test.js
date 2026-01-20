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
    });

    expect(instance).toBeInstanceOf(Instance);
  });
});
