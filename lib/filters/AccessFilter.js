import * as config from '../common/config.js';

const ACCESS_CONFIGURATION = config.get('security.access', {
  enabled: true,
  patterns: [/^(?!\/auth(?:\/|$)).*/, /^(?!\/public(?:\/|$)).*/, /^(?!\/api(?:\/|$)).*/],
});

export function AccessFilter({ user, req, res, next, handler }) {
  if (!ACCESS_CONFIGURATION.enabled) {
    return next();
  }

  const access = handler.access ?? (it => !!it);

  if (access(user)) return next();

  return res.end('Access Denied', 403);
}
