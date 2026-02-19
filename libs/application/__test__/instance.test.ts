import { Instance, InstanceError } from '../instance';
import { Logger } from '../logger';
import { Component, Metadata, RootModule } from '../../core';
import { AccessError } from '../command';
import { Session } from '../../security/session';

class TestLogger extends Logger {
  constructor() {
    super('TEST', process.stdout, process.stderr);
  }
}

describe('instance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    RootModule.Instance.clear();
  });

  it('load worker instance', async () => {
    const instance = await Instance.create(RootModule.Instance, new TestLogger());

    expect(instance).toBeInstanceOf(Instance);
  });

  it('load app module', async () => {
    new Component(
      'TestService',
      () => () => ({ message: 'Hello, World!' }),
      new Metadata(),
      RootModule.Instance
    );

    const instance = await Instance.create(RootModule.Instance, new TestLogger());

    expect(instance).toBeInstanceOf(Instance);
  });

  it('run execute handler', async () => {
    new Component(
      'TestHandler',
      () =>
        ({ body }: { body: string }) => ({ message: `Hello, ${body}!` }),
      Metadata.from({
        type: 'consumer',
        access: 'public',
        returns: { message: 'string' },
        body: 'string',
      }),
      RootModule.Instance
    );

    const instance = await Instance.create(RootModule.Instance, new TestLogger());
    const result = await instance.execute('TestHandler', 'World', new Session(), null);

    expect(result.isSuccess).toBeTruthy();
    expect(result.getOrElse({})).toEqual({ message: 'Hello, World!' });
  });

  it('run execute with private', async () => {
    new Component(
      'TestHandler',
      () => () => () => ({ message: `Hello, World!'` }),
      Metadata.from({ type: 'consumer', access: 'private', returns: { message: 'string' } }),
      RootModule.Instance
    );

    const instance = await Instance.create(RootModule.Instance, new TestLogger());
    const result = await instance.execute('TestHandler', null, new Session(), null);

    expect(result.isFailure).toBeTruthy();
    expect(result.errorOrNull()?.message).toBe('Access denied');
  });

  it('save change session', async () => {
    const session = new Session();

    new Component(
      'TestHandler',
      () =>
        ({ session }: { session: Session }) => {
          session.set('message', 'Hello, world!');
        },
      Metadata.from({ type: 'consumer', access: 'public' }),
      RootModule.Instance
    );

    const instance = await Instance.create(RootModule.Instance, new TestLogger());
    const result = await instance.execute('TestHandler', null, session, null);

    expect(result.isSuccess).toBeTruthy();
    expect(session.get('message')).toEqual('Hello, world!');
  });
});
