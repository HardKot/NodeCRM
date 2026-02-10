import { Session } from './session';
import { FunctionUtils } from '../utils';

interface AccessFunction {
  (session: Session): Promise<boolean> | boolean;
}

const AccessHandle = {
  Public: 'public',
  Private: 'private',
  Authenticated: 'authenticated',
  Anonymous: 'anonymous',
  ByRole: 'role: ',
  ByPermissions: 'permissions: ',
};

function PublicAccess() {
  return true;
}

function PrivateAccess() {
  return false;
}

function AuthenticatedAccess(session: Session) {
  return !!session;
}

function AnonymousAccess(session: Session) {
  return !session;
}

function ByRoleAccess(roleStr: `role: ${string}`, session: Session) {
  if (!session) return false;
  const roles = roleStr
    .substring(AccessHandle.ByRole.length)
    .split(',')
    .map(it => it.trim());

  for (const role of roles) {
    if (session.roles.includes(role)) return true;
  }

  return false;
}

function ByPermissionsAccess(permissionsStr: `permissions: ${string}`, session: Session) {
  if (!session) return false;
  const permissions = permissionsStr
    .substring(AccessHandle.ByPermissions.length)
    .split(',')
    .map(it => it.trim());

  for (const permission of permissions) {
    if (!session.permissions.includes(permission)) return false;
  }
  return true;
}

function parserAccess(source: string): AccessFunction {
  if (source === AccessHandle.Public) return PublicAccess;
  if (source === AccessHandle.Private) return PrivateAccess;
  if (source === AccessHandle.Authenticated) return AuthenticatedAccess;
  if (source === AccessHandle.Anonymous) return AnonymousAccess;
  if (source.startsWith(AccessHandle.ByRole))
    return FunctionUtils.curry(ByRoleAccess, source as `role: ${string}`);
  if (source.startsWith(AccessHandle.ByPermissions))
    return FunctionUtils.curry(ByPermissionsAccess, source as `permissions: ${string}`);
  return PrivateAccess;
}

function wrapAccessFunction(func: Function): AccessFunction {
  return (session: Session) => {
    try {
      return func(session);
    } catch (e) {
      return false;
    }
  };
}

export { parserAccess, wrapAccessFunction, PrivateAccess, AccessFunction };
