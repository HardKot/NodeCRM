const { factoryAccess } = require('../access.js');

describe('Access', () => {
  it("factoryAccess 'public'", () => {
    const accessFunc = factoryAccess('public');
    expect(accessFunc()).toBe(true);
  });

  it("factoryAccess 'private'", () => {
    const accessFunc = factoryAccess('private');
    expect(accessFunc()).toBe(false);
  });

  it("factoryAccess 'role:admin'", () => {
    const accessFunc = factoryAccess('role:admin');
    expect(accessFunc({ roles: ['admin', 'user'] })).toBe(true);
    expect(accessFunc({ roles: ['user'] })).toBe(false);
    expect(accessFunc(null)).toBe(false);
  });

  it("factoryAccess 'permissions:read,write'", () => {
    const accessFunc = factoryAccess('permissions:read,write');
    expect(accessFunc({ permissions: ['read', 'write', 'delete'] })).toBe(true);
    expect(accessFunc({ permissions: ['read'] })).toBe(false);
    expect(accessFunc(null)).toBe(false);
  });
});
