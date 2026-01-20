class AccessError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AccessError';
  }
}

function PublicAccess() {
  return true;
}

function PrivateAccess() {
  return false;
}

function ByRoleAccess(role, user) {
  if (!user) return false;
  return user.roles && user.roles.includes(role);
}

function ByPermissionsAccess(permissions, user) {
  if (!user) return false;
  for (const permission of permissions) {
    if (!user.permissions || !user.permissions.includes(permission)) return false;
  }
  return true;
}

const template = {
  public: 'public',
  private: 'private',
  role: 'role:',
  permissions: 'permissions:',
};

function factoryAccess(accessStr) {
  if (accessStr === template.public) return PublicAccess;
  if (accessStr === template.private) return PrivateAccess;
  if (accessStr.startsWith(template.role)) {
    const role = accessStr.substring(template.role.length);
    return user => ByRoleAccess(role, user);
  }
  if (accessStr.startsWith(template.permissions)) {
    const permissions = accessStr.substring(template.permissions.length).split(',');
    return user => ByPermissionsAccess(permissions, user);
  }
  throw new Error(`Unknown access type: ${accessStr}`);
}

module.exports = { factoryAccess, PrivateAccess, AccessError };
