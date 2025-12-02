import events from 'node:events';
import http2 from 'node:http2';
import { Request } from './request.js';
import { Response } from './response.js';
import { ServerRoutes } from './serverRoutes.js';

class ServerError extends Error {}

class Server extends events.EventEmitter {
  constructor(app, options = {}) {
    super();
    this.app = app;
    this.routes = new ServerRoutes(this.app);
    this.server = http2.createSecureServer();
    this.middlewares = options.middlewares ?? [];
    this.server.on('request', (req, res) => this.onRequest(Request.wrap(req), Response.wrap(res)));

    this.onNotFound = options.onNotFound ?? Server.defaultOnNotFound;
    this.onRequestError = options.onRequestError ?? Server.defaultOnRequestError;
  }

  async onRequest(request, response) {
    try {
      const routeNode = this.routes.route(request.url);
      if (!routeNode) return this.onNotFound(request, response);

      await this.runMiddlewares(request, response);
      const handler = routeNode[request.method.toLowerCase()];
    } catch (e) {
      return this.onRequestError(e, request, response);
    }
  }

  runMiddlewares(request, response) {
    const self = this;
    return new Promise((resolve, reject) => {
      function next(index) {
        const runner = this.middlewares[index] ?? resolve;
        runner(request, response, () => next(index + 1));
      }

      try {
        next.call(self, 0);
      } catch (e) {
        reject(e);
      }
    });
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
}
