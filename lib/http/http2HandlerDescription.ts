import type * as http2 from 'http2';
import { HttpHandlerDescriptionBase } from './httpHandlerDescriptionBase.ts';
import { CoreError } from '#constant';
import type { Http2Server } from './http2Server.ts';
import { Types } from '#utils';

interface Http1HandlerDescriptionProps {
  req: http2.Http2ServerRequest;
  res: http2.Http2ServerResponse;
  server: Http2Server;
}

export { Http2HandlerDescription };

class Http2HandlerDescription extends HttpHandlerDescriptionBase {
  #req: http2.Http2ServerRequest;
  #res: http2.Http2ServerResponse;
  #server: Http2Server;

  constructor({ req, res, server }: Http1HandlerDescriptionProps) {
    super();
    this.#req = req;
    this.#res = res;
    this.#server = server;
  }

  override readMethod(): IHttpMethodKey {
    const value = this.#req.method ?? '';
    return value.toUpperCase() as IHttpMethodKey;
  }

  override readUrl() {
    return this.#req.url ?? '';
  }

  override readIp() {
    return this.#req.socket.remoteAddress ?? '';
  }

  override readHeader(name: string) {
    return this.#req.headers[name.toLowerCase()] ?? '';
  }

  override statusCode(code: number) {
    if (code < 100 || code > 599) throw new CoreError(`Invalid status code: ${code}`);
    this.#res.statusCode = code;
  }

  override header(name: string, value: string | string[], replace = false) {
    if (replace) {
      this.#res.setHeader(name, value);
      return;
    }

    value = Array.isArray(value) ? value : [value];
    const currentValue = this.#res.getHeader(name) ?? [];
    const newValue = Array.isArray(currentValue) ? [...currentValue, ...value] : [...value];

    if (newValue.length === 1) value = newValue[0];
    this.#res.setHeader(name, value);
  }

  override readBody<T>(): Promise<T> {
    return this.#server.readBody<T>(this.#req, this.#req.headers);
  }

  override body<T>(data: T) {
    if (Types.isString(data)) this.#res.write(data);
    else if (Types.isWritableStream(data)) Types.normolizeWritableStream(data).pipe(this.#res);
    else if (Types.isBinary(data)) this.#res.write(data);
  }

  override async send() {
    if (!this.#res.writableEnded) this.#res.end();
  }
}
