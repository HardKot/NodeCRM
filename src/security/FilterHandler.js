import * as jwt from './jwt.js';

export class FilterHandler {
  constructor(filter, config = {}) {
    this.filter = filter;

    this.name = config.name || filter.name || 'anonymous';
    this.paterns = config.patterns || filter.patterns || ['*'];

    this.index = config.index || filter.index || Number.MAX_SAFE_INTEGER;

    Object.freeze(this);
  }

  match(req) {
    if (this.paterns.length === 0) return true;

    return this.paterns.some(pattern => {
      if (pattern instanceof RegExp) {
        return pattern.test(req.url);
      } else if (typeof pattern === 'string') {
        return req.url.includes(pattern);
      }
      return false;
    });
  }

  async apply(req, res, next) {
    if (!this.match(req)) return next(req, res);

    return this.filter.apply(this, req, res, next);
  }
}

export function RateLimit({ enabled = false, windowMs = 15 * 60 * 1000, maxRequests = 100 }) {
  const clients = new Map();

  return new FilterHandler(
    function ({ req, res, next }) {
      if (!enabled) return next();

      const ip = req.socket.remoteAddress;
      const now = Date.now();

      const clientData = clients.get(ip) || { count: 0, startTime: now };
      const elapsedTime = now - clientData.startTime;

      if (elapsedTime > windowMs) {
        clientData.count = 1;
        clientData.startTime = now;
      } else {
        clientData.count += 1;
      }

      clients.set(ip, clientData);

      if (clientData.count > maxRequests) {
        res.status = 429;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Retry-After', Math.ceil((windowMs - elapsedTime) / 1000));
        res.end(JSON.stringify({ message: 'Too many requests, please try again later.' }));
        return;
      }

      return next();
    },
    {
      index: 2,
    }
  );
}

export function CorsFilter({
  enabled = true,
  origin = '*',
  methods = 'GET,HEAD,PUT,PATCH,POST,DELETE',
}) {
  return new FilterHandler(function ({ res, next }) {
    if (!enabled) {
      return next();
    }

    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', methods);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return next();
  });
}

export function JWTFilter({ secret, publicKey, clocSkewSec }) {
  return new FilterHandler(function ({ res, req, next }) {
    if (!req.headers.authorization?.length || req.headers.authorization.indexOf('Bearer ') === -1) {
      return next();
    }

    const token = req.headers.authorization.split(' ')[1];
    if (!jwt.verify(token, { secret, publicKey, clockSkewSec })) {
      res.status = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ message: 'Invalid token' }));
      return;
    }

    return next();
  });
}
