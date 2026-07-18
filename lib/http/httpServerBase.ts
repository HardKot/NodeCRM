import { HttpError } from '#constant';
import { Types } from '#utils';
import { DataParser, DataParserOptions } from './dataParser.ts';
import { Routes } from './routes.ts';

export { HttpServerBase };

interface IHttpServerBaseProps {
  routing?: IRoutes;
  dataParser?: IDataParser;
}

abstract class HttpServerBase {
  routing: IRoutes;
  dataParser: IDataParser;
  commnadDescription: IHttpHandlerDescription;

  constructor({ routing, dataParser }: IHttpServerBaseProps) {
    if (Types.isPrototypeOf(this, HttpServerBase)) {
      throw new Error('HttpServerBase is an abstract class and cannot be instantiated directly');
    }

    this.routing = routing ?? new Routes();
    this.dataParser = dataParser ?? DataParser;
    this.commnadDescription = this.createCommandDescription();
  }

  async close(): Promise<void> {
    Types.isNotImplementedError();
  }

  async run(): Promise<void> {
    Types.isNotImplementedError();
  }

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

  busyHandler(command: IHttpHandlerDescription) {
    command.statusCode(503);
    command.contentType('text/plain');
    command.body('Server is busy. Please try again later.');
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

  getBodyParser<T>(data: Buffer, contentType: string): Promise<T> {
    const [type, ...args] = contentType.split(';').map((it) => it.trim());
    if (!Types.isIn<IDataParser>(type, this.dataParser)) {
      return Promise.reject(new HttpError(`Unsupported content type: ${type}`, 415));
    }
    const options = Object.fromEntries(args.map((arg) => arg.split('=').map((it) => it.trim()))) as DataParserOptions;
    const parser = this.dataParser[type].bind(this.dataParser);
    return parser(data, options) as Promise<T>;
  }
}
