const { Instance } = require('../application/instance.js');

describe('instance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('load worker instance', async () => {
    class AppService {}

    const AppModule = {
      providers: [AppService],
      consumers: [],
      imports: [],
    };

    const instance = await Instance.run({
      path: '/app',
      stdout: process.stdout,
      stderr: process.stderr,
      module: AppModule,
    });

    expect(instance).toBeInstanceOf(Instance);
  });

  it('load module dependency', async () => {
    class AppService {}
    class ExtraService {}

    const ExtraModule = {
      providers: [ExtraService],
      consumers: [],
      imports: [],
    };

    const AppModule = {
      providers: [AppService],
      consumers: [],
      imports: [ExtraModule],
    };

    const instance = await Instance.run({
      path: '/app',
      stdout: process.stdout,
      stderr: process.stderr,
      module: AppModule,
    });

    expect(instance).toBeInstanceOf(Instance);
  });

  it('run execute handler', async () => {
    function testHandler({ body, params, session }) {
      return { message: 'Hello, ' + body.name };
    }
    testHandler.body = { name: 'string' };
    testHandler.returns = { message: 'string' };
    testHandler.access = 'public';

    const AppModule = {
      providers: [],
      consumers: [testHandler],
      imports: [],
    };

    const instance = await Instance.run({
      path: '/app',
      stdout: process.stdout,
      stderr: process.stderr,
      module: AppModule,
    });

    const result = await instance.execute('testHandler', { name: 'World' });
    expect(result.isSuccess).toBe(true);
    expect(result.getOrElse({})).toEqual({ message: 'Hello, World' });
  });

  it('run execute handler class', async () => {
    class TestController {
      static body = { name: 'string' };
      static returns = { message: 'string' };
      static access = 'public';

      get({ body, params, session }) {
        return { message: 'Hello, ' + body.name };
      }
    }

    const AppModule = {
      providers: [],
      consumers: [TestController],
      imports: [],
    };

    const instance = await Instance.run({
      path: '/app',
      stdout: process.stdout,
      stderr: process.stderr,
      module: AppModule,
    });

    const result = await instance.execute('TestController.get', { name: 'World' });
    expect(result.isSuccess).toBe(true);
    expect(result.getOrElse({})).toEqual({ message: 'Hello, World' });
  });

  it('save change session', async () => {
    function testHandler({ body, params, session }) {
      session.set('id', 1);

      return { message: 'Hello, ' + session.get('name') };
    }
    testHandler.returns = { message: 'string' };
    testHandler.access = 'public';

    const AppModule = {
      providers: [],
      consumers: [testHandler],
      imports: [],
    };

    const instance = await Instance.run({
      path: '/app',
      stdout: process.stdout,
      stderr: process.stderr,
      module: AppModule,
    });

    const session = new Map([['name', 'World']]);
    const result = await instance.execute('testHandler', null, session);
    expect(result.isSuccess).toBe(true);
    expect(result.getOrElse({})).toEqual({ message: 'Hello, World' });
    expect(session.get('id')).toEqual(1);
  });

  it('when module config is function', async () => {
    const appModule = jest.fn(() => {
      return {
        providers: [],
        consumers: [],
        imports: [],
      };
    });

    await Instance.run({
      path: '/app',
      stdout: process.stdout,
      stderr: process.stderr,
      module: appModule,
    });

    expect(appModule).toHaveBeenCalled();
  });

  it('when module is object with onChange property', async () => {
    let callback = () => {};

    function testHandler1() {
      return { message: 'Hello, World!' };
    }
    testHandler1.returns = { message: 'string' };
    testHandler1.access = 'public';

    const appModule = {
      current: {
        providers: [],
        consumers: [testHandler1],
        imports: [],
      },
      onChange: cb => (callback = cb),
    };

    const instance = await Instance.run({
      path: '/app',
      stdout: process.stdout,
      stderr: process.stderr,
      module: appModule,
    });

    expect(callback).toBeInstanceOf(Function);
    const result1 = await instance.execute('testHandler1');
    expect(result1.isSuccess).toBe(true);
    expect(result1.getOrElse({})).toEqual({ message: 'Hello, World!' });

    function testHandler2() {
      return { message: 'Hello, Men!' };
    }
    testHandler2.returns = { message: 'string' };
    testHandler2.access = 'public';

    const testHandler3 = () => {
      return { message: 'Hello, Women!' };
    };
    testHandler3.returns = { message: 'string' };
    testHandler3.access = 'public';

    appModule.current.consumers = [testHandler2, testHandler3];

    await callback?.();

    expect(await instance.execute('testHandler1')).toHaveProperty('isSuccess', false);

    const result2 = await instance.execute('testHandler2');
    expect(result2.isSuccess).toBe(true);
    expect(result2.getOrElse({})).toEqual({ message: 'Hello, Men!' });

    const result3 = await instance.execute('testHandler3');
    expect(result3.isSuccess).toBe(true);
    expect(result3.getOrElse({})).toEqual({ message: 'Hello, Women!' });
  });
});
