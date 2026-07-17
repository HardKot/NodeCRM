import { Types } from '#utils';
import crypto from 'node:crypto';

export { BaseHttpHandlerDescription };

abstract class BaseHttpHandlerDescription implements IHttpHandlerDescription {
  #id: string;
  constructor() {
    if (Types.isPrototypeOf(this, BaseHttpHandlerDescription)) {
      throw new Error('HttpHandlerDescription is an abstract class and cannot be instantiated directly');
    }

    this.#id = crypto.randomInt(1e9).toString(36).padStart(6, '0');
  }

  getId() {
    return this.#id;
  }

  getMethod() {
    return Types.isNotImplementedError<IHttpMethodKey>();
  }

  getUrl() {
    return Types.isNotImplementedError<string>();
  }

  getPath() {
    return Types.isNotImplementedError<string>();
  }

  getIp() {
    return Types.isNotImplementedError<string>();
  }

  getProtocol() {
    return Types.isNotImplementedError<string>();
  }

  getContentType() {
    return Types.isNotImplementedError<string>();
  }

  getParam(_: string) {
    return Types.isNotImplementedError<string[] | string | undefined>();
  }

  getHeader(_: string) {
    return Types.isNotImplementedError<string[] | string | undefined>();
  }

  getCookie(_: string) {
    return Types.isNotImplementedError<string | undefined>();
  }

  statusCode(_: number) {
    return Types.isNotImplementedError();
  }

  async getBody<T>(): Promise<T> {
    return Types.isNotImplementedError();
  }

  contentType(_: string) {
    return Types.isNotImplementedError();
  }

  body<T>(_: T) {
    return Types.isNotImplementedError();
  }

  send() {
    return Types.isNotImplementedError();
  }

  redirect(_: string) {
    return Types.isNotImplementedError();
  }

  cookie(_: string, __: string) {
    return Types.isNotImplementedError();
  }

  header(_: string, __: string | string[]) {
    return Types.isNotImplementedError();
  }
}
