const http2 = require('node:http2');

const { Request } = require('./request.js');
const { Response } = require('./response.js');
const { Routes } = require('./routes.js');

class ServerError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code || 500;
  }
}

class Server {
  constructor(app, options = {}) {
    this.app = app;
    this.port = options.port ?? 3000;
    this.host = options.host ?? '127.0.0.1';
    this.tls = options.tls;
    this.requestTimeout = options.timeout ?? 60_000;
    this.maxSessions = options.maxSessions ?? 1024;

    if (!this.tls?.key || !this.tls?.cert) {
      throw new Error('TSL key and certificate are required to create a secure HTTP/2 server.');
    }

    this.server = http2.createSecureServer({
      allowHTTP1: true,
      key: this.tls.key,
      cert: this.tls.cert,
    });

    this.server.setTimeout(this.requestTimeout);
    this.activeSessions = new Set();
    this.routes = new Routes();

    this.server.on('request', this.onRequest.bind(this));
    this.server.on('session', this.onSession.bind(this));

    Object.freeze(this);
  }

  setConsumers(consumers) {
    this.routes = Routes.create(consumers);
    return this;
  }

  async onRequest(req, res) {
    const request = Request.wrap(req);
    const response = Response.wrap(res);

    try {
      const handler = this.routes.route(request.path);
      if (!handler) {
        return this.onError(new ServerError('Not Found', 404), response);
      }

      const body = await request.json();
      const result = await handler.run(request, body);

      return response.json(result).send();
    } catch (e) {
      return this.onError(e, response);
    }
  }

  onError(error, response) {
    response.status = error?.code || 500;
    response.json({ error: error?.message || 'Internal Server Error' });
    response.send();
  }

  onSession(session) {
    this.activeSessions.add(session);

    session.on('close', () => {
      this.activeSessions.delete(session);
    });
  }

  start() {
    if (!this.server.listening) return;

    this.server.listen(this.port);
  }

  stop() {
    return new Promise(resolve => {
      this.server.close(() => {
        this.app.emit('server.stopped', this);
        resolve();
      });
    });
  }
}

module.exports = { Server, ServerError };
