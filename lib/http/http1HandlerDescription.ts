import type * as http from 'http';
import { HttpHandlerDescription } from './httpHandlerDescription.ts';
import { HttpUtils } from './httpUtils.ts';

interface Http1HandlerDescriptionProps {
  req: http.IncomingMessage;
  res: http.ServerResponse;
  templatePath?: string;
}

class Http1HandlerDescription extends HttpHandlerDescription {
  #req: http.IncomingMessage;
  #res: http.ServerResponse;

  #templatePath?: string;
  #params: Record<string, string | string[]> = {};
  #cookies: Record<string, string> = {};

  constructor({ req, res, templatePath }: Http1HandlerDescriptionProps) {
    super();
    this.#req = req;
    this.#res = res;
    this.#templatePath = templatePath;
    this.#params = HttpUtils.extractQueryParams(req.url ?? '');
    this.#cookies = HttpUtils.parserCookies(req.headers.cookie);
    if (templatePath) {
      const pathParams = HttpUtils.extactPathParams(req.url ?? '', templatePath);
      this.#params = { ...this.#params, ...pathParams };
    }
  }

  override getMethod() {
    return HttpUtils.normalizeMethodKey(this.#req.method ?? '');
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
    this.#res.statusCode = code;
  }

  override contentType(contentType: string) {
    this.#res.setHeader('Content-Type', contentType);
  }

  override header(name: string, value: string | string[]) {
    value = Array.isArray(value) ? value : [value];
    const currentValue = this.#res.getHeader(name) ?? [];
    const newValue = Array.isArray(currentValue) ? [...currentValue, ...value] : [...value];

    if (newValue.length === 1) value = newValue[0];
    this.#res.setHeader(name, value);
  }

  override cookie(name: string, value: string) {
    this.#res.setHeader('Set-Cookie', `${name}=${value}; Path=/; HttpOnly`);
  }
}
