import type * as http from 'http';
import { BaseHttpHandlerDescription } from './baseHttpHandlerDescription.ts';
import { HttpUtils } from './httpUtils.ts';

interface Http1HandlerDescriptionProps {
  req: http.IncomingMessage;
  res: http.ServerResponse;
  templatePath?: string;
  maxBodySize: number;
}

export { HttpHandlerDescription };

class HttpHandlerDescription extends BaseHttpHandlerDescription {
  #req: http.IncomingMessage;
  #res: http.ServerResponse;

  #params: Record<string, string | string[]> = {};
  #cookies: Record<string, string> = {};
  #maxBodySize: number;

  constructor({ req, res, templatePath, maxBodySize }: Http1HandlerDescriptionProps) {
    super();
    this.#req = req;
    this.#res = res;
    this.#params = HttpUtils.extractQueryParams(req.url ?? '');
    this.#maxBodySize = maxBodySize;
    this.#cookies = HttpUtils.parserCookies(req.headers.cookie);
    if (templatePath) {
      const pathParams = HttpUtils.extactPathParams(req.url ?? '', templatePath);
      this.#params = { ...this.#params, ...pathParams };
    }
  }

  override getBody<T>(): Promise<T> {
    const headerSize = this.#req.headers['content-length'] ? parseInt(this.#req.headers['content-length'], 10) : 0;
    const contentType = this.#req.headers['content-type'] ?? '';

    return new Promise((resolve, reject) => {
      if (headerSize > this.#maxBodySize) return Promise.reject(new Error('Request body too large'));
      const chunks: Buffer[] = [];

      this.#req.on('data', (chunk) => {
        chunks.push(chunk);
        if (Buffer.concat(chunks).length > this.#maxBodySize) {
          reject(new Error('Request body too large'));
          this.#req.destroy();
        }
      });

      this.#req.on('end', () => {
        const body = Buffer.concat(chunks).toString();
      });
    });
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
