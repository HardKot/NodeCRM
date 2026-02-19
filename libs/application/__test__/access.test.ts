import { parserAccess } from '../../security/access';
import { Session } from '../../security/session';

describe('Access', () => {
  it("factoryAccess 'public'", () => {
    const accessFunc = parserAccess('public');
    expect(accessFunc(new Session())).toBe(true);
  });

  it("factoryAccess 'private'", () => {
    const accessFunc = parserAccess('private');
    expect(accessFunc(new Session())).toBe(false);
  });

  it("factoryAccess 'role:admin'", () => {
    const accessFunc = parserAccess('role: admin');
    const sessionWithAdmin = new Session();
    const sessionWithoutAdmin = new Session();

    sessionWithAdmin.set('roles', ['admin', 'user']);
    sessionWithoutAdmin.set('roles', ['user']);

    expect(accessFunc(sessionWithAdmin)).toBe(true);
    expect(accessFunc(sessionWithoutAdmin)).toBe(false);
    expect(accessFunc(new Session())).toBe(false);
  });

  it("factoryAccess 'permissions: read, write'", () => {
    const accessFunc = parserAccess('permissions: read, write');
    const sessionWithPermissions = new Session();
    const sessionWithoutPermissions = new Session();

    sessionWithPermissions.set('permissions', ['read', 'write', 'delete']);
    sessionWithoutPermissions.set('permissions', ['read']);

    expect(accessFunc(sessionWithPermissions)).toBe(true);
    expect(accessFunc(sessionWithoutPermissions)).toBe(false);
    expect(accessFunc(new Session())).toBe(false);
  });
});
