import http2 from 'node:http2';

import { Request } from './request.js';
import { Response } from './response.js';
import { Routes } from './routes.js';
import { InstanceEvent } from '../core/index.js';

class HttpServerError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code || 500;
  }
}

class HttpServer {
  static factory(options) {
    return new HttpServer(options);
  }

  constructor(options = {}) {
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
    this.routes = Routes.initialize();
    this.runCommand = () => null;

    this.server.on('request', this.onRequest.bind(this));
    this.server.on('session', this.onSession.bind(this));
  }

  async init(instance) {
    this.server.listen(this.port);
    this.runCommand = instance.runCommand.bind(instance);

    instance.on(InstanceEvent.BUILD, () => {
      this.routes = Routes.byCommands(instance.commands);
    });
    instance.on(InstanceEvent.UPDATE, () => {
      this.routes = Routes.byCommands(instance.commands);
    });
  }

  async onRequest(req, res) {
    const request = Request.wrap(req);
    const response = Response.wrap(res);

    try {
      const handler = this.routes.route(request.path);
      if (!handler) {
        return this.onError(new HttpServerError('Not Found', 404), response);
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
}

export { HttpServer, HttpServerError };
