import * as http2 from'node:http2';

import { Routes, Routing } from './routes';
import { ExecCommand, IInstance, Plugin } from '../application';
import { ContentType, ParserContent } from './parserContent';
import { HandleRequest } from './handleRequest';
import { Session } from '../application/session';
import { Result, Types } from '../utils';
import * as stream from 'node:stream';
import * as streamWeb from 'node:stream/web';
import { HttpUtils, RESTMethod } from './httpUtils';

class HttpServerError extends Error {
  constructor(message: string, public readonly code: number = 500) {
    super(message);
  }
}

export interface TLSOptions {
  key: Buffer;
  cert: Buffer;
}

interface HttpServerOptions {
  port?: number;
  host?: string;
  tls: TLSOptions;
  timeout?: number;
  maxSessions?: number;
  bodyLimit?: number;
  contentType?: ContentType | ContentType[];
}

type OctetStream = typeof Buffer | typeof Blob | typeof stream.Writable | typeof streamWeb.WritableStream | typeof stream.Readable | typeof streamWeb.ReadableStream;
type RequestParams = {
  contentType?: string;
  acceptType?: string[];
  path: string;
  handler: HandleRequest | null;
};


const ApplicationOctetStream = 'application/octet-stream';

class HttpServer implements Plugin {
  static factory(options: HttpServerOptions) {
    return new HttpServer(
      options.tls,
      options.port,
      options.host,
      options.timeout,
      options.maxSessions,
      options.bodyLimit,
      Array.isArray(options.contentType)
        ? options.contentType
        : [options.contentType ?? 'application/json']
    );
  }

  public readonly name = 'HttpServer';
  private activeSessions: Set<http2.ServerHttp2Session>;
  private routing: Routing = Routes.initialize();
  private runCommand: ExecCommand | null = null;
  private handlers: HandleRequest[] = [];
  private server: http2.Http2SecureServer;
  public readonly primaryContentTyp: ContentType;

  constructor(
    public readonly tls: TLSOptions,
    public readonly port: number = 8443,
    public readonly host: string = '127.0.0.1',
    public readonly requestTimeout: number = 60_000,
    public readonly maxSessions: number = 1024,
    public readonly bodyLimit: number = 1024,
    public readonly contentType: ContentType[] = ['application/json']
  ) {
    this.primaryContentTyp = contentType[0] ?? 'application/json';

    this.server = http2.createSecureServer({
      allowHTTP1: true,
      key: this.tls.key,
      cert: this.tls.cert,
    });

    this.server.setTimeout(this.requestTimeout);
    this.activeSessions = new Set();
    this.routing = Routes.initialize();

    this.server.on('request', this.onRequest.bind(this));
    this.server.on('session', this.onSession.bind(this));
  }

  async init(instance: IInstance) {
    this.runCommand = instance.execute.bind(instance);
    this.handlers = instance.commandsList
      .map(cmd => HandleRequest.fromCommand(cmd))
      .filter(it => !!it);
    this.routing = Routes.byHandlers(this.handlers);
    Object.freeze(this.handlers);
    this.server.listen(this.port);
  }

  onSession(session: http2.ServerHttp2Session) {
    if (this.activeSessions.size >= this.maxSessions) {
      session.close();
      return;
    }
    this.activeSessions.add(session);

    session.on('close', () => {
      this.activeSessions.delete(session);
    });
  }

  async onRequest(request: http2.Http2ServerRequest, response: http2.Http2ServerResponse) {
    try {
      const requestParams = this.extractRequestParams(request);
      const paramsValidation = this.validateRequestParams(requestParams);

      if (paramsValidation.isFailure) {
        return this.onError(response, paramsValidation.errorOrNull());
      }
      const handler = requestParams.handler!;

      const body = await this.getContent(request);
      const params = handler.getParams(request);

      const result = await this.runCommand!(handler.name, body, new Session(), params);

      if (result.isFailure) {
        const error = result.errorOrNull() ?? new HttpServerError('Internal Server Error', 500);
        return this.onError(response, error);
      }

      const data = result.getOrNull()!;

      if (Types.isBinary(data)) return this.sendBufferContent(response, data);
      if (Types.isWritableStream(data)) return this.sendStreamContent(response, data);

      let acceptType = this.primaryContentTyp;
      if (!!requestParams.acceptType && this.isSupportedContentType(requestParams.acceptType)) {
        for (const type of requestParams.acceptType) {
          if (this.contentType.includes(type)) {
            acceptType = type;
            break;
          }
        }
      }

      await this.sendDataContent(response, data, acceptType);
    } catch (e) {
      let error: Error;
      if (Error.isError(e)) {
        error = e;
      } else {
        error = new HttpServerError(`${e}`, 500);
      }

      await this.onError(response, error);
    }
  }

  async onError(response: http2.Http2ServerResponse, error: Error | null) {
    response.statusCode = 500;
    if (error instanceof HttpServerError) response.statusCode = error.code;

    await this.sendDataContent(
      response,
      { error: error?.message ?? 'Internal Server Error' },
      this.primaryContentTyp
    );
  }

  private async getContent(req: http2.Http2ServerRequest) {
    return new Promise((res, rej) => {
      const body: Buffer[] = [];
      req.on('data', chunk => {
        if (typeof chunk === 'string') body.push(Buffer.from(chunk));
        else body.push(chunk);
      });
      req.on('end', async () => {
        const contentType = (req.headers['content-type'] as ContentType) ?? 'application/json';
        const contentBuffer = Buffer.concat(body);
        if (contentBuffer.length > this.bodyLimit)
          return rej(new HttpServerError('Payload Too Large', 413));
        if (contentType === 'application/octet-stream') return res(Buffer.concat(body));

        const parser = ParserContent.selectFromParser(contentType);

        if (!parser)
          return rej(new HttpServerError(`Unsupported content type: ${contentType}`, 415));

        try {
          if (contentBuffer.length === 0) return res(undefined);
          res(await parser(contentBuffer.toString()));
        } catch (e) {
          rej(new HttpServerError('Invalid content format', 400));
        }
      });
      req.on('error', err => rej(err));
    });
  }

  private async sendBufferContent(response: http2.Http2ServerResponse, buffer: Buffer | Blob) {
    response.setHeader('Content-Type', 'application/octet-stream');
    if (buffer instanceof Blob) buffer = Buffer.from(await buffer.arrayBuffer());
    response.end(buffer);
  }
  private async sendStreamContent(
    response: http2.Http2ServerResponse,
    _stream: stream.Writable | streamWeb.WritableStream
  ) {
    response.setHeader('Content-Type', 'application/octet-stream');
    if (_stream instanceof streamWeb.WritableStream) _stream = stream.Writable.fromWeb(_stream);
    _stream.pipe(response);
  }
  private async sendDataContent(
    response: http2.Http2ServerResponse,
    content: any,
    contentType: ContentType
  ) {
    const parser = ParserContent.selectToParser(contentType);
    if (!parser) {
      response.statusCode = 415;
      response.end(`Unsupported content type: ${contentType}`);
      return;
    }
    response.setHeader('Content-Type', contentType);
    const parsedContent = await parser(content);
    response.end(parsedContent);
  }

  private getPath(request: http2.Http2ServerRequest) {
    return request.url?.split('?')[0] || '/';
  }
  private getContentType(data?: string) {
    if (!data) return undefined;
    return data.split(';')[0].trim();
  }
  private extractRequestParams(request: http2.Http2ServerRequest): RequestParams {
    const contentType = this.getContentType(request.headers['content-type']) ?? this.primaryContentTyp;
    const acceptType = this.getContentType(request.headers['accept'])
      ?.split(',')
      .map(it => it.trim());
    const path = this.getPath(request);

    let method: RESTMethod = 'get';
    if (HttpUtils.isRestMethod(request.method)) method = request.method.toLowerCase() as RESTMethod;

    const handler = this.routing(path, method);

    return {
      contentType,
      acceptType,
      path,
      handler,
    };
  }


  private isSupportedContentType(contentType: string[]): contentType is ContentType[];
  private isSupportedContentType(contentType: string): contentType is ContentType;
  private isSupportedContentType(contentType: string | string[]): contentType is ContentType | ContentType[] {
    if (Array.isArray(contentType)) {
      return contentType.some(it => this.isSupportedContentType(it));
    }

    if (contentType === 'application/octet-stream') return true;
    if (contentType === this.primaryContentTyp) return true;
    return this.contentType.includes(contentType as ContentType);
  }
  private isBinaryType(types: any): types is OctetStream {
    if (types === Buffer || types === Blob) return true;
    if (types === stream.Readable || types === stream.Writable) return true;
    return types === streamWeb.ReadableStream || types === streamWeb.WritableStream;
  }
  private validateRequestParams(params: RequestParams): Result<boolean, HttpServerError> {
    if (!params.handler || !this.runCommand) {
      return Result.failure(new HttpServerError('Not Found', 404));
    }

    if (!params.contentType || !this.isSupportedContentType(params.contentType)) {
      return Result.failure(new HttpServerError('Unsupported Media Type', 415));
    }
    if (params.acceptType && !this.isSupportedContentType(params.acceptType)) {
      return Result.failure(new HttpServerError('Not Acceptable', 406));
    }

    if (
      this.isBinaryType(params.handler.bodySchema) &&
      params.contentType !== ApplicationOctetStream
    ) {
      return Result.failure(new HttpServerError('Unsupported Media Type for binary content', 415));
    }

    return Result.success(true);
  }
}

export { HttpServer, HttpServerError };
