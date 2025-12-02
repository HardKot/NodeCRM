import http2 from 'node:http2';
import { Functions } from '../utils';
import { Request } from './request.js';
import { Response } from './response.js';
import { ServerRoutes } from './serverRoutes.js';
import { RequestContext } from './requestContext.js';

class Server {
  constructor(app, options = {}) {
    this.app = app;
    this.middlewares = options.middlewares ?? [];
    this.port = options.port ?? 3000;
    this.host = options.host ?? '127.0.0.0';
    this.tsl = options.tsl;
    this.timeout = options.timeout ?? 60_000;
    if (!this.tsl || !this.tsl.key || !this.tsl.cert) {
      throw new Error('TSL key and certificate are required to create a secure HTTP/2 server.');
    }

    this.routes = new ServerRoutes(this.app);
    this.server = http2.createSecureServer({
      allowHTTP1: true,
      key: this.tsl.key,
      cert: this.tsl.cert,
    });
    this.server.setTimeout(this.timeout);

    this.server.on('request', (req, res) => this.onRequest(req, res));
    this.server.on('error', err => this.onError(err));

    this.onNotFound = options.onNotFound ?? Server.defaultOnNotFound;
    this.onRequestError = options.onRequestError ?? Server.defaultOnRequestError;
    this.onTimeout = options.onTimeout ?? Server.defaultOnTimeout;
  }

  start() {
    this.server.listen(this.port, this.host, () => {
      this.app.emit('server.started', this);
    });
  }

  stop() {
    this.server.close(() => {
      this.app.emit('server.stopped', this);
    });
  }

  async onRequest(request, response) {
    try {
      request = Request.wrap(request);
      response = Response.wrap(response);
      const handler = this.routes.route(request.url, request.method);
      if (!handler) return this.onNotFound(request, response);
      await RequestContext.run(new RequestContext(request), async () => {
        await Functions.runChains(this.middlewares, request, response);
        const result = await handler.run({
          signal: AbortSignal.timeout(this.timeout),
        });
        response.data(result, request.contentType()).send();
      });
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
    response.status(404).data('Not Found', request.contentType()).send();
  }

  static defaultOnRequestError(err, request, response) {
    if (err instanceof Error) {
      response.status(err.code ?? 500);
    }
    response.data(err.message, request.contentType()).send();
  }

  static defaultOnTimeout(request, response) {
    response.status(503).data('Service Unavailable', request.contentType()).send();
  }
}

export { Server };
