import stream from 'node:stream';
import type streamWeb from 'node:stream/web';

import { GeneratorUtils, Types } from '#utils';
import { HttpUtils } from './httpUtils.ts';

export { HttpHandlerDescriptionBase };

abstract class HttpHandlerDescriptionBase implements IHttpHandlerDescription {
  #id: string;
  #templatePath?: string;

  #pathCache?: string;
  #cookiesCache?: Record<string, string | string[]>;
  #paramsCache?: Record<string, string | string[]>;
  #hostCache?: string;

  constructor() {
    if (Types.isPrototypeOf(this, HttpHandlerDescriptionBase)) {
      throw new Error('HttpHandlerDescription is an abstract class and cannot be instantiated directly');
    }

    this.#id = GeneratorUtils.generateId();
  }

  abstract readMethod(): IHttpMethodKey;
  abstract readUrl(): string;
  abstract readIp(): string;
  abstract readHeader(_: string): string | string[] | undefined;
  abstract readBody<T>(): Promise<T>;
  abstract header(_: string, __: string | string[], replace?: boolean): void;
  abstract statusCode(_: number): void;
  abstract body<T>(_: T): void;
  abstract send(): Promise<void>;

  injectTemplatePath(templatePath: string) {
    this.#templatePath = templatePath;
    this.#paramsCache = undefined;
  }

  getId() {
    return this.#id;
  }

  readProtocol() {
    if (this.readUrl()?.startsWith('https://')) return 'https';
    return 'http';
  }

  readHost(): string | undefined {
    if (!this.#hostCache) {
      const hostHeader = this.readHeader('host');
      if (hostHeader) {
        if (Array.isArray(hostHeader)) this.#hostCache = hostHeader[0];
        else this.#hostCache = hostHeader;
      } else {
        const url = this.readUrl();
        if (!url) return undefined;
        const urlObj = new URL(url);
        this.#hostCache = urlObj.host;
      }
    }
    return this.#hostCache;
  }

  readPath() {
    if (!this.#pathCache) {
      const url = this.readUrl();
      if (!url) return '';
      if (url.startsWith('http://') || url.startsWith('https://')) {
        const urlObj = new URL(url);
        return urlObj.pathname;
      }
      this.#pathCache = url.split('?')[0];
    }
    return this.#pathCache;
  }

  readContentType() {
    const contentType = this.readHeader('content-type');
    if (Array.isArray(contentType)) return contentType[0];
    return contentType;
  }

  readParam<T>(name: string): T {
    if (!this.#paramsCache) {
      this.#paramsCache = HttpUtils.extractQueryParams(this.readUrl() ?? '');
      if (this.#templatePath)
        this.#paramsCache = {
          ...this.#paramsCache,
          ...HttpUtils.extactPathParams(this.readUrl() ?? '', this.#templatePath),
        };
    }

    return this.#paramsCache[name] as T;
  }

  readCookie(name: string) {
    if (!this.#cookiesCache) {
      const cookieHeader = this.readHeader('cookie');
      if (!cookieHeader) {
        this.#cookiesCache = {};
      } else {
        const cookieString = Array.isArray(cookieHeader) ? cookieHeader.join('; ') : cookieHeader;
        this.#cookiesCache = HttpUtils.parserCookies(cookieString);
      }
    }

    return this.#cookiesCache[name];
  }

  contentType(contentType: string, options?: { charset?: string; boundary?: string }) {
    if (options?.charset) contentType += `; charset=${options.charset}`;
    if (options?.boundary) contentType += `; boundary=${options.boundary}`;
    this.header('Content-Type', contentType, true);
  }

  async redirect(url: string) {
    this.statusCode(302);
    this.header('Location', url, true);
    await this.send();
  }

  cookie(
    name: string,
    value: string,
    options?: { path?: string; httpOnly?: boolean; secure?: boolean; maxAge?: number }
  ) {
    let valueStr = `${name}=${value}`;
    if (options?.path) valueStr += `; Path=${options.path}`;
    if (options?.httpOnly) valueStr += '; HttpOnly';
    if (options?.secure) valueStr += '; Secure';
    if (options?.maxAge !== undefined) valueStr += `; Max-Age=${options.maxAge}`;
    this.header('Set-Cookie', valueStr, false);
  }

  json<T>(body: T) {
    this.contentType('application/json', { charset: 'utf-8' });
    this.body(JSON.stringify(body));
  }

  message(message: string) {
    this.contentType('text/plain', { charset: 'utf-8' });
    this.body(message);
  }

  binary(data: Buffer | Blob, type?: string) {
    const _stream = new stream.Writable();
    this.stream(_stream, type);
    _stream.write(data);
    _stream.end();
  }

  stream(stream: stream.Writable | streamWeb.WritableStream, type?: string) {
    if (!type) type = 'application/octet-stream';
    if (type) this.contentType(type);
    this.body(stream);
  }
}
