import * as config from '../common/config.js';

const RATE_LIMIT_CONFIGURATION = config.get('security.rateLimit', {
  enabled: true,
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // limit each IP to 100 requests per windowMs
});

const clients = new Map();

export function RateLimit({ req, res, next }) {
  if (!RATE_LIMIT_CONFIGURATION.enabled) {
    return next();
  }

  const ip = req.socket.remoteAddress;
  const now = Date.now();

  const clientData = clients.get(ip) || { count: 0, startTime: now };
  const elapsedTime = now - clientData.startTime;

  if (elapsedTime > RATE_LIMIT_CONFIGURATION.windowMs) {
    clientData.count = 1;
    clientData.startTime = now;
  } else {
    clientData.count += 1;
  }

  clients.set(ip, clientData);

  if (clientData.count > RATE_LIMIT_CONFIGURATION.maxRequests) {
    res.statusCode = 429; // Too Many Requests
    res.end('Too Many Requests - try again later');
    return;
  }

  return next();
}
RateLimit.index = 2;
