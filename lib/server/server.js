import { Flow } from '../common/flow.js';
import http2 from 'node:http2';
import { NotFoundError } from './NotFoundError.js';
import { Objects } from '../common/utils.js';

export class Server {
  constructor({ app, api, security }) {
    this.app = app;
    this.api = api;
    this.security = security;

    this.httpServer = null;

    this.port = +app.config.get('server.port', 3000);
    this.certificateName = app.config.get('server.certificate', 'default');
    this.timeout = app.config.get('server.timeout', 3000);

    this.notFoundError = app.config.get('server.notFound', NotFoundError);

    this.certificate = {};
    this.host = app.config.get('server.host', '0.0.0.0');
  }

  async load() {
    this.certificate = await Flow.of(this.app.modules)
      .filter(it => it.isCertificate() && it.path.startsWith(`/app/cert/${this.certificateName}/`))
      .map(async it => [it.name, await it.content()])
      .toObject()
      .get();

    Object.freeze(this.certificate);

    this.httpServer = http2.createSecureServer({
      key: this.certificate.key,
      cert: this.certificate.cert,
      allowHTTP1: true,
      keepAlive: true,
    });

    this.httpServer.on('request', (req, res) => this.onRequest(req, res));
    this.httpServer.on('connection', socket => this.onConnection(socket));
    this.httpServer.on('session', session => this.onSession(session));
    this.httpServer.on('stream', (stream, headers) => this.onStream(stream, headers));

    this.httpServer.setTimeout(5000);
  }

  onRequest(req, res) {
    const method = req.method;
    const pathname = req.url.split('?').at(0);

    try {
      const handler = Objects.requireNotNull(
        this.api.findActionHandler(pathname, method),
        new this.notFoundError({ pathname, method })
      );
    } catch (error) {
      const errorHandler = this.api.findErrorHandler(pathname, method);
      errorHandler.run({ req, res, error });
    }
  }

  onConnection() {}

  onSession() {}

  onStream() {}
}
