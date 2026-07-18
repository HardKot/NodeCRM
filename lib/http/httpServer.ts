import http from 'node:http';
import https from 'node:https';
import util from 'node:util';

import { HttpError } from '#constant';
import { Types } from '#utils';

import { HttpUtils } from './httpUtils.ts';
import { HttpServerBase } from './httpServerBase.ts';
import { HttpHandlerDescription } from './httpHandlerDescription.ts';

export { HttpServer };

class HttpServer extends HttpServerBase implements IHttpServer {
  #server: http.Server;
  #port: number;
  #host: string;
  #currentRequestCount: number = 0;
  #maxRequestCount: number = Infinity;
  #maxBodySize: number = 1024 * 1024 * 10; // 10MB

  constructor(props: CreateHttpProps) {
    super({ routing: props.routing, dataParser: props.dataParser });
    this.#port = props.port;
    this.#host = props.host;
    this.#currentRequestCount = 0;
    this.#maxRequestCount = props.requestPoolSize;
    this.#maxBodySize = props.maxBodySize;

    this.#server = this.createServer(
      {
        requestTimeout: props.requestTimeout,
        optimizeEmptyRequests: true,
      },
      props.tls
    );

    if (props.onError) this.errorHandler = props.onError;
    if (props.onBusy) this.busyHandler = props.onBusy;
    if (props.onNotFound) this.notFoundHandler = props.onNotFound;

    this.#server.on('request', this.createRequestHandler.bind(this));
  }

  override run() {
    return util.promisify<number, string>(this.#server.listen).call(this.#server, this.#port, this.#host);
  }

  override close() {
    return util.promisify(this.#server.close).call(this.#server);
  }

  createServer(options: http.ServerOptions, tls: { key: string; cert: string } | null): http.Server {
    if (tls) return https.createServer({ ...options, ...tls });
    return http.createServer(options);
  }

  async createRequestHandler(req: http.IncomingMessage, res: http.ServerResponse) {
    const commands = new HttpHandlerDescription({ req, res });
    const params = HttpUtils.extractQueryParams(req.url ?? '');
    commands.getBody = () => this.#getBody(req);
    commands.getParam = (name: string) => params[name];

    try {
      if (!this.#validateRequestMethod(req, res)) return;
      if (this.#validateRequestCount(commands)) return;

      this.#currentRequestCount++;
      const action = this.routing.find(commands.getPath(), commands.getMethod());
      if (!action) return this.notFoundHandler(commands);
      Object.assign(params, HttpUtils.extactPathParams(req.url ?? '', action.mapping));

      await action(commands);
    } catch (err) {
      this.errorHandler(Types.normolizeError(err), commands);
    } finally {
      this.#currentRequestCount--;
      if (!res.writableEnded) res.end();
    }
  }

  #validateRequestCount(command: HttpHandlerDescription): boolean {
    if (this.#currentRequestCount < this.#maxRequestCount) return true;

    this.busyHandler(command);
    return false;
  }

  #validateRequestMethod(req: http.IncomingMessage, res: http.ServerResponse): boolean {
    const method = HttpUtils.normalizeMethodKey(req.method ?? '');
    if (method) return true;

    res.statusCode = 405;
    res.setHeader('Content-Type', 'text/plain');
    res.end(`Method ${req.method} not allowed`);
    return false;
  }

  async #getBody<T>(req: http.IncomingMessage): Promise<T> {
    const contentType = req.headers['content-type'] ?? 'application/json';
    const contentLength = req.headers['content-length'] ? parseInt(req.headers['content-length'], 10) : 0;
    const error = new HttpError(`Request body too large. Max size is ${this.#maxBodySize} bytes`, 413);
    if (contentLength !== 0 && contentLength > this.#maxBodySize) throw error;
    return await this.getBodyParser<T>(await this.#readData(req), contentType);
  }

  #readData(req: http.IncomingMessage): Promise<Buffer> {
    const error = new HttpError(`Request body too large. Max size is ${this.#maxBodySize} bytes`, 413);
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      let totalSize = 0;

      req.on('data', (chunk: Buffer) => {
        totalSize += chunk.length;
        if (totalSize > this.#maxBodySize) return reject(error);
        chunks.push(chunk);
      });

      req.on('end', () => {
        const body = Buffer.concat(chunks);
        resolve(body);
      });
    });
  }
}
