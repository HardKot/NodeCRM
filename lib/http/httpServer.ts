import http from 'node:http';
import https from 'node:https';
import util from 'node:util';

import { HttpMethod } from '#constant';
import { Types } from '#utils';

import { HttpServerBase } from './httpServerBase.ts';
import { HttpHandlerDescription } from './httpHandlerDescription.ts';

export { HttpServer };

type ValidateRequestHandler = (req: http.IncomingMessage, res: http.ServerResponse) => OptionalPromise<boolean>;

interface HttpServerProps extends CreateHttpProps {
  onValidateRequestUrl?: ValidateRequestHandler;
  onValidateRequestMethod?: ValidateRequestHandler;
  onValidateRequestCount?: ValidateRequestHandler;
}

class HttpServer extends HttpServerBase implements IHttpServer {
  #server: http.Server;
  #port: number;
  #host: string;
  #validateRequestUrl: ValidateRequestHandler;
  #validateRequestMethod: ValidateRequestHandler;
  #validateRequestCount: ValidateRequestHandler;

  constructor(props: HttpServerProps) {
    super(props);
    this.#port = props.port;
    this.#host = props.host;

    this.#server = this.createServer(
      {
        requestTimeout: props.requestTimeout,
        optimizeEmptyRequests: true,
      },
      props.tls
    );

    if (props.onError) this.errorHandler = props.onError;
    if (props.onNotFound) this.notFoundHandler = props.onNotFound;

    this.#validateRequestUrl = props.onValidateRequestUrl ?? this.#defaultValidateRequestUrl.bind(this);
    this.#validateRequestMethod = props.onValidateRequestMethod ?? this.#defaultValidateRequestMethod.bind(this);
    this.#validateRequestCount = props.onValidateRequestCount ?? this.#defaultValidateRequestCount.bind(this);

    this.#server.on('request', this.createRequestHandler.bind(this));
  }

  override run() {
    return util.promisify<number, string>(this.#server.listen).call(this.#server, this.#port, this.#host);
  }

  override stop() {
    return util.promisify(this.#server.close).call(this.#server);
  }

  createServer(options: http.ServerOptions, tls: { key: string; cert: string } | null): http.Server {
    if (tls) return https.createServer({ ...options, ...tls });
    return http.createServer(options);
  }

  async createRequestHandler(req: http.IncomingMessage, res: http.ServerResponse) {
    let params: Record<string, string | string[]> = {};
    const startTime = Date.now();
    const commands = new HttpHandlerDescription({ req, res });
    commands.getBody = () => this.readBody(req, req.headers);
    commands.getParam = (name: string) => params[name];

    try {
      this.incrementRequestCount();

      if (!this.#validateRequestMethod(req, res)) return;
      if (!this.#validateRequestCount(req, res)) return;
      if (!this.#validateRequestUrl(req, res)) return;

      const action = this.routing.find(commands.getPath(), commands.getMethod());
      if (!action) {
        this.logger.info(`Request not found: ${commands.getMethod()} ${commands.getPath()} from ${commands.getIp()}`);
        return this.notFoundHandler(commands);
      }
      Object.assign(params, this.parserUrlParams(req.url!, action.mapping));
      this.logger.info(`Request: ${commands.getMethod()} ${commands.getPath()} from ${commands.getIp()}`);

      await action.command(commands);
      this.logger.info(
        `Response: IP: ${commands.getIp()} -> [${commands.getMethod()}] ${commands.getPath()} -> ${Date.now() - startTime}ms`
      );
    } catch (err) {
      this.errorHandler(Types.normolizeError(err), commands);
      this.logger.error(
        `Response Error: IP: ${commands.getIp()} -> [${commands.getMethod()}] ${commands.getPath()} -> ${Date.now() - startTime}ms; Error: ${Types.normolizeError(err).message}`
      );
    } finally {
      this.decrementRequestCount();
      if (!res.writableEnded) res.end();
    }
  }

  #defaultValidateRequestCount(_: http.IncomingMessage, res: http.ServerResponse): boolean {
    if (this.currentRequestCount < this.options.maxRequestCount) return true;

    res.statusCode = 503;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Server is busy. Please try again later.');
    return false;
  }

  #defaultValidateRequestMethod(req: http.IncomingMessage, res: http.ServerResponse): boolean {
    const method = req.method ?? '';
    const upperMethod = method.toUpperCase();
    if (upperMethod in HttpMethod) return true;

    res.statusCode = 405;
    res.setHeader('Content-Type', 'text/plain');
    res.end(`Method ${method} not allowed`);

    return false;
  }

  #defaultValidateRequestUrl(req: http.IncomingMessage, res: http.ServerResponse): boolean {
    const url = req.url;
    if (url) return true;

    res.statusCode = 400;
    res.setHeader('Content-Type', 'text/plain');
    res.end(`Invalid URL: ${url}`);
    return false;
  }
}
