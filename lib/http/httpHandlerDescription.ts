import type * as http from 'http';
import { BaseHttpHandlerDescription } from './baseHttpHandlerDescription.ts';
import { HttpUtils } from './httpUtils.ts';
import { CoreError, HttpError } from '#constant';

interface Http1HandlerDescriptionProps {
  req: http.IncomingMessage;
  res: http.ServerResponse;
  templatePath?: string;
}

export { HttpHandlerDescription };

class HttpHandlerDescription extends BaseHttpHandlerDescription {
  #req: http.IncomingMessage;
  #res: http.ServerResponse;

  #params: Record<string, string | string[]> = {};
  #cookies: Record<string, string> = {};

  constructor({ req, res, templatePath }: Http1HandlerDescriptionProps) {
    super();
    this.#req = req;
    this.#res = res;
    this.#params = HttpUtils.extractQueryParams(req.url ?? '');
    this.#cookies = HttpUtils.parserCookies(req.headers.cookie);
    if (templatePath) {
      const pathParams = HttpUtils.extactPathParams(req.url ?? '', templatePath);
      this.#params = { ...this.#params, ...pathParams };
    }
  }

  override getMethod(): IHttpMethodKey {
    const value = this.#req.method ?? '';
    return value.toUpperCase() as IHttpMethodKey;
  }

  override getIp() {
    return this.#req.socket.remoteAddress ?? '';
  }

  override getProtocol() {
    return 'http';
  }

  override getContentType() {
    return this.#req.headers['content-type'] ?? '';
  }

  override getParam(name: string) {
    return this.#params[name];
  }

  override getHeader(name: string) {
    return this.#req.headers[name.toLowerCase()];
  }

  override getCookie(name: string) {
    return this.#cookies[name];
  }

  override statusCode(code: number) {
    if (code < 100 || code > 599) throw new CoreError(`Invalid status code: ${code}`);
    this.#res.statusCode = code;
  }

  override contentType(contentType: string, options?: { charset?: string; boundary?: string }) {
    if (options?.charset) contentType += `; charset=${options.charset}`;
    if (options?.boundary) contentType += `; boundary=${options.boundary}`;
    this.#res.setHeader('Content-Type', contentType);
  }

  override header(name: string, value: string | string[]) {
    value = Array.isArray(value) ? value : [value];
    const currentValue = this.#res.getHeader(name) ?? [];
    const newValue = Array.isArray(currentValue) ? [...currentValue, ...value] : [...value];

    if (newValue.length === 1) value = newValue[0];
    this.#res.setHeader(name, value);
  }

  override cookie(
    name: string,
    value: string,
    options?: { path?: string; httpOnly?: boolean; secure?: boolean; maxAge?: number }
  ) {
    let valueStr = `${name}=${value}`;
    if (options?.path) valueStr += `; Path=${options.path}`;
    if (options?.httpOnly) valueStr += '; HttpOnly';
    if (options?.secure) valueStr += '; Secure';
    if (options?.maxAge !== undefined) valueStr += `; Max-Age=${options.maxAge}`;
    this.#res.setHeader('Set-Cookie', valueStr);
  }
}
