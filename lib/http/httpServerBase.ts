import { HttpError } from '#constant';
import { Types } from '#utils';
import { Routes } from './routes.ts';

export { HttpServerBase };

abstract class HttpServerBase {
  routing: Routes;
  commnadDescription: IHttpHandlerDescription;

  constructor() {
    if (Types.isPrototypeOf(this, HttpServerBase)) {
      throw new Error('HttpServerBase is an abstract class and cannot be instantiated directly');
    }

    this.routing = new Routes();
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

  defaultNotFoundHandler(command: IHttpHandlerDescription) {
    command.statusCode(404);
    command.contentType('text/plain');
    command.body('Not Found');
    command.send();
  }

  defaultBusyHandler(command: IHttpHandlerDescription) {
    command.statusCode(503);
    command.contentType('text/plain');
    command.body('Server is busy. Please try again later.');
    command.send();
  }

  defaultErrorHandler(err: Error, command: IHttpHandlerDescription) {
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
}
