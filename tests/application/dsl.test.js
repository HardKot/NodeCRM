import { createApp } from '../../libs/application/dsl.js';

describe('SpaceJS DSL integration', () => {
  class UserRepository {
    constructor() { this.users = [{ id: 1, name: 'Alice' }]; }
    getAllUsers() { return this.users; }
    postConstructor() { this.inited = true; }
    preDestroy() { this.destroyed = true; }
  }
  class UserService {
    constructor(userRepository) { this.userRepository = userRepository; }
    getAllUsers() { return this.userRepository.getAllUsers(); }
  }
  class Logger {
    constructor() { this.logs = []; }
    log(msg) { this.logs.push(msg); }
  }

  let app;
  beforeEach(() => {
    app = createApp();
    app.beans(bean => {
      bean('userRepository', UserRepository).singleton();
      bean('userService', UserService).singleton().dependsOn('userRepository').alias('service');
      bean('requestLogger', Logger).request();
    });
    app.routing(route => {
      route('/api/users')
        .get(async (ctx) => {
          const userService = await ctx.getBean('service');
          return userService.getAllUsers();
        });
    });
  });

  it('should resolve singleton beans and aliases', async () => {
    const repo = await app.getBean('userRepository');
    const service = await app.getBean('service');
    expect(service.userRepository).toBe(repo);
    expect(repo.inited).toBe(true);
  });

  it('should create request beans per call', async () => {
    const logger1 = await app.getBean('requestLogger', { scopeId: 'req1' });
    const logger2 = await app.getBean('requestLogger', { scopeId: 'req2' });
    expect(logger1).not.toBe(logger2);
  });

  it('should handle routing and DI integration', async () => {
    const routeDef = app.router.find('/api/users', 'GET');
    const ctx = { getBean: (name) => app.getBean(name), params: {}, request: {}, response: {}, session: {} };
    const result = await routeDef.handler(ctx);
    expect(result).toEqual([{ id: 1, name: 'Alice' }]);
  });

  it('should support route security DSL', async () => {
    app = createApp();
    app.routing(route => {
      route('/secure').authenticated().get(() => 'ok');
      route('/admin').hasRole('admin').get(() => 'admin');
    });

    const secure = app.router.find('/secure', 'GET');
    expect(secure.accessChecker(null)).toBe(false);
    expect(secure.accessChecker({})).toBe(true);

    const admin = app.router.find('/admin', 'GET');
    expect(admin.accessChecker({ roles: ['admin'] })).toBe(true);
    expect(admin.accessChecker({ roles: ['user'] })).toBe(false);
  });
});
