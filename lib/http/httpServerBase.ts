import { HttpError, HttpMethod } from '#constant';
import { Types } from '#utils';
import { Readable } from 'node:stream';
import { DataParser } from './dataParser.ts';
import { Routes } from './routes.ts';
import { HttpUtils } from './httpUtils.ts';

export { HttpServerBase };

interface HttpOptions {
  maxBodySize: number;
  maxRequestCount: number;
  cors?: string | string[] | boolean;
}

type IContentType = { 'content-type': string };
type IContentLength = { 'content-length': string };

const defaultOptions: HttpOptions = {
  maxBodySize: 10 * 1024 * 1024, // 10MB
  maxRequestCount: Infinity,
};

abstract class HttpServerBase implements IHttpServer {
  routing: IRoutes;
  dataParser: IDataParser;
  commnadDescription: IHttpHandlerDescription;
  options: HttpOptions;
  currentRequestCount: number = 0;
  logger: ILogger;

  constructor({ routing, dataParser, logger, requestPoolSize, maxBodySize }: CreateHttpProps) {
    if (Types.isPrototypeOf(this, HttpServerBase)) {
      throw new Error('HttpServerBase is an abstract class and cannot be instantiated directly');
    }

    this.routing = routing ?? new Routes();
    this.dataParser = dataParser ?? DataParser;
    this.commnadDescription = this.createCommandDescription();
    this.options = {
      maxBodySize: maxBodySize ?? defaultOptions.maxBodySize,
      maxRequestCount: requestPoolSize ?? defaultOptions.maxRequestCount,
    };
    this.logger = logger.extend('HttpServer');

    if (!this.stop) this.stop = async () => Types.isNotImplementedError();
    if (!this.run) this.run = async () => Types.isNotImplementedError();
  }

  abstract stop(): Promise<void>;
  abstract run(): Promise<void>;

  createCommandDescription(): IHttpHandlerDescription {
    return {
      getId() {
        return Types.isNotImplementedError();
      },
      getMethod() {
        return Types.isNotImplementedError();
      },
      getUrl: () => Types.isNotImplementedError(),
      getPath: () => Types.isNotImplementedError(),
      getIp: () => Types.isNotImplementedError(),
      getProtocol: () => Types.isNotImplementedError(),
      getContentType: () => Types.isNotImplementedError(),
      getParam: () => Types.isNotImplementedError(),
      getHeader: () => Types.isNotImplementedError(),
      getCookie: () => Types.isNotImplementedError(),
      statusCode: () => Types.isNotImplementedError(),
      getBody: async <T>(): Promise<T> => Types.isNotImplementedError(),
      contentType: () => Types.isNotImplementedError(),
      body: () => Types.isNotImplementedError(),
      send: () => Types.isNotImplementedError(),
      redirect: () => Types.isNotImplementedError(),
      cookie: () => Types.isNotImplementedError(),
      header: () => Types.isNotImplementedError(),
    };
  }

  notFoundHandler(command: IHttpHandlerDescription) {
    command.statusCode(404);
    command.contentType('text/plain');
    command.body('Not Found');
    command.send();
  }

  errorHandler(err: Error, command: IHttpHandlerDescription) {
    command.contentType('text/plain');
    if (err instanceof HttpError) {
      command.statusCode(err.statusCode);
      command.body(err.message);
    } else {
      command.statusCode(500);
      command.body('Internal Server Error');
    }
    command.send();
  }

  async readBody<T>(stream: Readable, headers: Partial<IContentType & IContentLength>): Promise<T> {
    const { type, options } = this.parserContentType(headers['content-type'] ?? '');
    this.validateBodySize(parseInt(headers['content-length'] ?? '0', 10));

    const parser = this.dataParser[type].bind(this.dataParser);
    const data = await this.#readDataAsync(stream);
    const body = await parser(data, options);
    return body as T;
  }

  #readDataAsync(stream: Readable): Promise<Buffer> {
    const error = new HttpError(`Request body too large. Max size is ${this.options.maxBodySize} bytes`, 413);
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      let totalSize = 0;

      stream.on('data', (chunk: Buffer) => {
        totalSize += chunk.length;
        if (totalSize > this.options.maxBodySize) return reject(error);
        chunks.push(chunk);
      });

      stream.on('end', () => {
        const body = Buffer.concat(chunks);
        resolve(body);
      });
    });
  }

  validateBodySize(size: number): boolean {
    if (Number.isNaN(size) || size <= 0) throw new HttpError(`Invalid content-length header`, 400);
    if (size > this.options.maxBodySize)
      throw new HttpError(`Request body too large. Max size is ${this.options.maxBodySize} bytes`, 413);
    return true;
  }

  validateRequestMethod(method: string): method is IHttpMethodKey {
    const upperMethod = method.toUpperCase();
    if (upperMethod in HttpMethod) return true;
    throw new HttpError(`Method ${method} not allowed`, 405);
  }

  parserContentType(contentType: string): { type: string; options: DataParserOptions } {
    const [type, ...args] = contentType.split(';').map((it) => it.trim());
    if (!Types.isIn<IDataParser>(type, this.dataParser)) {
      throw new HttpError(`Unsupported content type: ${type}`, 415);
    }
    const options = Object.fromEntries(args.map((arg) => arg.split('=').map((it) => it.trim()))) as DataParserOptions;
    return { type, options };
  }

  parserUrlParams(url: string, template?: string): Record<string, string | string[]> {
    const queryParams = HttpUtils.extractQueryParams(url);
    const pathParams = template ? HttpUtils.extactPathParams(url, template) : {};
    return { ...queryParams, ...pathParams };
  }

  parserCookies(cookieHeader: string | undefined): Record<string, string> {
    const cookies: Record<string, string> = {};
    if (!cookieHeader) return cookies;

    for (const cookie of cookieHeader.split(';')) {
      const [name, ...rest] = cookie.split('=');
      cookies[name.trim()] = rest.join('=').trim();
    }

    return cookies;
  }

  incrementRequestCount() {
    this.currentRequestCount++;
  }

  decrementRequestCount() {
    this.currentRequestCount--;
  }
}
