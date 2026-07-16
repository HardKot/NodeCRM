import http from 'node:http';
import https from 'node:https';

import crypto from 'node:crypto';
import util from 'node:util';

import { HttpError } from '#constant';
import { Types } from '#utils';

import { HttpUtils } from './httpUtils.ts';
import { HttpServerBase } from './httpServerBase.ts';

interface CreateRequestHandlerProps {
  onRequest: (command: IHttpHandlerDescription) => Promise<void>;
  onBusy?: (command: IHttpHandlerDescription) => void;
  onError?: (error: Error, command: IHttpHandlerDescription) => void;
  onNotFound?: (command: IHttpHandlerDescription) => void;
}

class HttpServer1 extends HttpServerBase implements IHttpServer {
  #server: http.Server;
  #port: number;
  #host: string;
  #currentRequestCount: number = 0;
  #maxRequestCount: number = Infinity;
  #maxBodySize: number = 1024 * 1024 * 10; // 10MB

  constructor(props: CreateHttpProps) {
    super();
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

    this.#server.on('request', this.createRequestHandler(props));
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

  createRequestHandler({ onRequest, onBusy, onError, onNotFound }: CreateRequestHandlerProps) {
    const errorHandler = onError ?? this.defaultErrorHandler;
    const busyHandler = onBusy ?? this.defaultBusyHandler;
    const notFoundHandler = onNotFound ?? this.defaultNotFoundHandler;

    return async (req: http.IncomingMessage, res: http.ServerResponse) => {
      const commands = new Http1HandlerDescription(req, res);
      try {
        if (!this.#validateRequestMethod(commands, req)) return;
        if (this.#currentRequestCount >= this.#maxRequestCount) return busyHandler(commands);
        this.#createBodyReader(commands, req, res);
        await onRequest(commands);
      } catch (err) {
        errorHandler(Types.normolizeError(err), commands);
      } finally {
        this.#currentRequestCount--;
        if (!res.writableEnded) res.end();
      }
    };
  }

  createCommnadDescription(): IHttpHandlerDescription {
    const command = this.commnadDescription;

    const contentType = req.headers['content-type'];
    const params = HttpUtils.extractQueryParams(req.url ?? '');
    const cookies = HttpUtils.parserCookies(req.headers.cookie);

    return {
      getId: () => '',
      getMethod: () => 'UNKNOWN',
      getUrl: () => req.url ?? '',
      getPath: () => req.url?.split('?')[0] ?? '',
      getIp: () => req.socket.remoteAddress ?? '',
      getProtocol: () => req.httpVersion,
      getContentType: () => contentType,
      getParam: (name: string) => params[name],
      getHeader: (name: string) => req.headers[name.toLowerCase()],
      getCookie: (name: string) => cookies[name],
      statusCode: (code: number) => {
        res.statusCode = code;
      },
      getBody: async <T>(): Promise<T> => Promise.reject(new Error('getBody is not implemented')),
      contentType: (type: string) => {
        res.setHeader('Content-Type', type);
      },
      body: (body: string | Buffer) => {
        res.write(body);
      },
      send: () => {
        if (!res.writableEnded) res.end();
      },
      redirect: (url) => {
        res.statusCode = 302;
        res.setHeader('Location', url);
        res.end();
      },
      cookie: (name: string, value: string) => {
        res.setHeader('Set-Cookie', `${name}=${value}; Path=/; HttpOnly`);
      },
      header: (name: string, value: string | string[]) => {
        res.setHeader(name, value);
      },
    };
  }

  #createBodyReader(command: IHttpHandlerDescription, req: http.IncomingMessage) {
    const contentType = req.headers['content-type'];
    const contentLength = req.headers['content-length'];

    return () =>
      new Promise((resolve, reject) => {
        if (!contentType) return resolve(undefined);
        if (contentLength && parseInt(contentLength) > this.#maxBodySize) {
          return reject(new HttpError('Request body too large', 413));
        }

        const chunks: Buffer[] = [];
        req.on('data', (chunk) => {
          chunks.push(chunk);
          if (Buffer.concat(chunks).length > this.#maxBodySize) {
            return reject(new HttpError('Request body too large', 413));
          }
        });

        req.on('end', () => { });
      });
  }

  #validateRequestMethod(command: IHttpHandlerDescription, req: http.IncomingMessage): boolean {
    const method = HttpUtils.normalizeMethodKey(req.method ?? '');
    if (method) {
      command.getMethod = () => method;
      return true;
    }

    command.statusCode(405);
    command.contentType('text/plain');
    command.body(`Method ${req.method} not allowed`);
    return false;
  }
}
