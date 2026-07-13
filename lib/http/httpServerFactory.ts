import http from 'node:http';
import https from 'node:https';
import http2 from 'node:http2';

import crypto from 'node:crypto';
import util from 'node:util';

import { HttpError } from '#constant';
import { Pool, Types } from '#utils';

interface CreateHttpProps {
  tls: { key: string; cert: string } | null;
  http2: boolean;
  http1: boolean;
  requestTimeout: number;
  requestPoolSize: number;
  port: number;
  host: string;

  onRequest: (req: IHttpRequest, res: IHttpResponse) => void;
  onError?: (err: Error, req: IHttpRequest, res: IHttpResponse) => void;
  onBusy?: (req: IHttpRequest, res: IHttpResponse) => void;
}

interface IHttpServer {
  run: () => Promise<void>;
}

function HttpServerFactory(props: CreateHttpProps) {
  if (!props.http1 && !props.http2) throw new HttpError('Either http1 or http2 must be enabled');
  if (!props.tls && !props.http2) return new Http1Server(props);
}

class Http1Server implements IHttpServer {
  #server: http.Server;
  #port: number;
  #host: string;
  #currentRequestCount: number = 0;
  #maxRequestCount: number = Infinity;

  constructor(props: CreateHttpProps) {
    this.#port = props.port;
    this.#host = props.host;
    this.#currentRequestCount = 0;
    this.#maxRequestCount = props.requestPoolSize;

    this.#server = this.createServer(
      {
        requestTimeout: props.requestTimeout,
        optimizeEmptyRequests: true,
      },
      props.tls
    );

    this.#server.on('request', this.#onRequest);
    this.#server.on('error', this.#onError);
  }

  run() {
    return util.promisify<number, string>(this.#server.listen).call(this.#server, this.#port, this.#host);
  }

  close() {
    return util.promisify(this.#server.close).call(this.#server);
  }

  createServer(options: http.ServerOptions, tls: { key: string; cert: string } | null): http.Server {
    if (tls) return https.createServer({ ...options, ...tls });
    return http.createServer(options);
  }

  createRequestHandler(
    onRequest: (req: IHttpRequest, res: IHttpResponse) => void | Promise<void>,
    onError?: (err: Error, req: IHttpRequest, res: IHttpResponse) => void | Promise<void>,
    onBusy?: (req: IHttpRequest, res: IHttpResponse) => void | Promise<void>
  ) {
    const errorHandler = onError ?? this.#defaultErrorHandler;
    const busyHandler = onBusy ?? this.#defaultBusyHandler;

    return async (req: http.IncomingMessage, res: http.ServerResponse) => {
      try {
        if (this.#currentRequestCount >= this.#maxRequestCount) return busyHandler(req, res);
        await onRequest(req, res);
      } catch (err) {
        errorHandler(Types.normolizeError(err), req, res);
      } finally {
        this.#currentRequestCount--;
        if (!res.writableEnded) res.end();
      }
    };
  }

  #createReply(req: http.IncomingMessage, res: http.ServerResponse): IHttpRequest {
    const requestId = crypto.randomInt(1e9).toString(36).padStart(6, '0');
    res.setHeader('X-Request-Id', requestId);

    const contentType = req.headers['content-type'];
    const params = this.#createParams(req, req.url ?? '');

    return {
      getId: () => requestId,
      getMethod: () => req.method,
      getUrl: () => req.url ?? '',
      getIp: () => req.socket.remoteAddress ?? '',
      getProtocol: () => req.httpVersion,
      getContentType: () => contentType,
      getParam: (name: string) => params[name],
    };
  }

  #defaultBusyHandler(_: http.IncomingHttpHeaders, res: http.ServerResponse) {
    res.writeHead(503, { 'Content-Type': 'text/plain' });
    res.end('Server is busy. Please try again later.');
  }

  #defaultErrorHandler(err: Error, req: http.IncomingMessage, res: http.ServerResponse) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }

  #createParams(req: http.IncomingMessage, urlTemplate: string): Record<string, string> {
    const url = new URL(req.url ?? '', `http://${req.headers.host}`);
    const params: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      params[key] = value;
    });

    return params;
  }
}
