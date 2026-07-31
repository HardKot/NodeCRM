import http2 from 'node:http2';
import util from 'node:util';

import { HttpMethod } from '#constant';
import { Types } from '#utils';

import { HttpServerBase } from './httpServerBase.ts';
import { Http2HandlerDescription } from './http2HandlerDescription.ts';

export { Http2Server };

type ValidateRequestHandler = (
  req: http2.Http2ServerRequest,
  res: http2.Http2ServerResponse
) => OptionalPromise<boolean>;

interface HttpServerProps extends CreateHttpProps {
  onValidateRequestUrl?: ValidateRequestHandler;
  onValidateRequestMethod?: ValidateRequestHandler;
}

class Http2Server extends HttpServerBase implements IHttpServer {
  #server: http2.Http2Server;
  #port: number;
  #host: string;
  #sessions: Set<http2.Http2Session>;

  #validateRequestUrl: ValidateRequestHandler;
  #validateRequestMethod: ValidateRequestHandler;

  constructor(props: HttpServerProps) {
    super(props);
    this.#port = props.port;
    this.#host = props.host;
    this.#sessions = new Set();

    this.#server = this.createServer(
      {
        allowHTTP1: props.http1,
      },
      props.tls
    );
    this.#server.setTimeout(props.requestTimeout);

    if (props.onError) this.errorHandler = props.onError;
    if (props.onNotFound) this.notFoundHandler = props.onNotFound;

    this.#validateRequestUrl = props.onValidateRequestUrl ?? this.#defaultValidateRequestUrl.bind(this);
    this.#validateRequestMethod = props.onValidateRequestMethod ?? this.#defaultValidateRequestMethod.bind(this);

    this.#server.on('request', this.createRequestHandler.bind(this));
    this.#server.on('session', (session) => {
      if (this.#sessions.size >= this.options.maxRequestCount) return session.close();
      this.#sessions.add(session);
      session.on('close', () => this.#sessions.delete(session));
    });
  }

  override run() {
    return util.promisify<number, string>(this.#server.listen).call(this.#server, this.#port, this.#host);
  }

  override stop() {
    return util.promisify(this.#server.close).call(this.#server);
  }

  createServer(
    options: http2.ServerOptions & http2.SecureServerOptions,
    tls: { key: string; cert: string } | null
  ): http2.Http2Server {
    if (tls) return http2.createSecureServer({ ...options, ...tls });
    return http2.createServer({ ...options });
  }

  async createRequestHandler(req: http2.Http2ServerRequest, res: http2.Http2ServerResponse) {
    const startTime = Date.now();
    const commands = new Http2HandlerDescription({ req, res, server: this });

    try {
      if (!this.#validateRequestMethod(req, res)) return;
      if (!this.#validateRequestUrl(req, res)) return;

      const action = this.routing.find(commands.readPath(), commands.readMethod());
      if (!action) {
        this.logger.info(
          `Request not found: ${commands.readMethod()} ${commands.readPath()} from ${commands.readIp()}`
        );
        return this.notFoundHandler(commands);
      }
      this.logger.info(`Request: ${commands.readMethod()} ${commands.readPath()} from ${commands.readIp()}`);

      await action.command(commands);
      this.logger.info(
        `Response: IP: ${commands.readIp()} -> [${commands.readMethod()}] ${commands.readPath()} -> ${Date.now() - startTime}ms`
      );
    } catch (err) {
      this.errorHandler(Types.normolizeError(err), commands);
      this.logger.error(
        `Response Error: IP: ${commands.readIp()} -> [${commands.readMethod()}] ${commands.readPath()} -> ${Date.now() - startTime}ms; Error: ${Types.normolizeError(err).message}`
      );
    } finally {
      if (!res.writableEnded) res.end();
    }
  }

  #defaultValidateRequestMethod(req: http2.Http2ServerRequest, res: http2.Http2ServerResponse): boolean {
    const method = req.method ?? '';
    const upperMethod = method.toUpperCase();
    if (upperMethod in HttpMethod) return true;

    res.statusCode = 405;
    res.setHeader('Content-Type', 'text/plain');
    res.end(`Method ${method} not allowed`);

    return false;
  }

  #defaultValidateRequestUrl(req: http2.Http2ServerRequest, res: http2.Http2ServerResponse): boolean {
    const url = req.url;
    if (url) return true;

    res.statusCode = 400;
    res.setHeader('Content-Type', 'text/plain');
    res.end(`Invalid URL: ${url}`);
    return false;
  }
}
