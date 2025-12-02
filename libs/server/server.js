import http2 from 'node:http2';

import { Functions, Types } from '#lib/utils';

import { Request } from './request.js';
import { Response } from './response.js';
import { Routes } from './routes.js';
import { Session } from './session.js';

class Server {
  constructor(app, options = {}) {
    this.app = app;
    this.middlewares = options.middlewares ?? [];
    this.port = options.port ?? 3000;
    this.host = options.host ?? '127.0.0.1';
    this.tls = options.tls;
    this.requestTimeout = options.timeout ?? 60_000;
    this.maxSession = options.maxSession ?? 1024;

    if (!this.tls || !this.tls.key || !this.tls.cert) {
      throw new Error('TSL key and certificate are required to create a secure HTTP/2 server.');
    }

    this.routes = new Routes(this.app);
    this.server = http2.createSecureServer({
      allowHTTP1: true,
      key: this.tls.key,
      cert: this.tls.cert,
    });

    this.activeSessions = new Array(options.maxSession).fill(null);

    this.server.on('request', (req, res) => this.onRequest(req, res));
    this.server.on('session', session => this.onSession(session));
    this.server.on('error', err => this.onError(err));

    this.onNotFound = options.onNotFound ?? Server.defaultOnNotFound;
    this.onRequestError = options.onRequestError ?? Server.defaultOnRequestError;
    this.onTimeout = options.onTimeout ?? Server.defaultOnTimeout;
    Object.freeze(this);
  }

  onSession(session) {
    session = Session.wrap(session);
    const freeIndex = this.activeSessions.findIndex(s => s === null);
    if (freeIndex === -1) return session.close();
    this.activeSessions[freeIndex] = session;

    session.on('close', () => {
      const index = this.activeSessions.indexOf(session);
      if (index !== -1) this.activeSessions[index] = null;
    });
  }

  start() {
    return new Promise(resolve => {
      this.server.listen(this.port, this.host, () => {
        this.app.emit('server.started', this);
        resolve();
      });
    });
  }

  stop() {
    return new Promise(resolve => {
      this.server.close(() => {
        this.app.emit('server.stopped', this);
        resolve();
      });
    });
  }

  async onRequest(request, response) {
    try {
      request = Request.wrap(request);
      response = Response.wrap(response);
      const handler = this.routes.route(request.url, request.method);
      if (!handler) return this.onNotFound(request, response);
      await Functions.runChains(this.middlewares, request, response);
      if (response.isSend) return;
      await handler.run(request, response);
    } catch (e) {
      if (e.name === 'AbortError') {
        return this.onTimeout(request, response);
      }
      return this.onRequestError(e, request, response);
    }
  }

  async onError(err) {
    console.error('Server error:', err);
  }

  static defaultOnNotFound(request, response) {
    if (response.isSend) return;
    response.status(404).data('Not Found', request.contentType).send();
  }

  static defaultOnRequestError(err, request, response) {
    if (response.isSend) return;
    response.status(Types.isInt(err?.code) ? err.code : 500);
    response.data(err.message, request.contentType).send();
  }

  static defaultOnTimeout(request, response) {
    if (response.isSend) return;
    response.status(503).data('Service Unavailable', request.contentType).send();
  }
}

export { Server };
