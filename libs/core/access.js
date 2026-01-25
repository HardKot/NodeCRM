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

function AuthenticatedAccess(session) {
  return !!session;
}

function AnonymousAccess(session) {
  return !session;
}

function ByRoleAccess(role, session) {
  if (!session) return false;
  return session.roles && session.roles.includes(role);
}

function ByPermissionsAccess(permissions, session) {
  if (!session) return false;
  for (const permission of permissions) {
    if (!session.permissions || !session.permissions.includes(permission)) return false;
  }
  return true;
}

const template = {
  anonymous: 'anonymous',
  authenticated: 'authenticated',
  public: 'public',
  private: 'private',
  role: 'role:',
  permissions: 'permissions:',
};

function factoryAccess(accessStr) {
  if (accessStr === template.public) return PublicAccess;
  if (accessStr === template.private) return PrivateAccess;
  if (accessStr === template.authenticated) return AuthenticatedAccess;
  if (accessStr === template.anonymous) return AnonymousAccess;
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

export { factoryAccess, PrivateAccess, AccessError };
