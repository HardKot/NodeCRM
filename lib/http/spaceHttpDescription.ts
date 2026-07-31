import path from 'node:path';
import fs from 'node:fs';

import { Types } from '#utils';
import { CoreError, HttpMethod } from '#constant';

export { SpaceHttpDescription };

class SpaceHttpDescription {
  #createProps: CreateHttpProps;

  constructor(createProps: CreateHttpProps) {
    this.#createProps = createProps;
  }

  http1() {
    this.#createProps.http1 = true;
  }

  http2() {
    this.#createProps.http2 = true;
  }

  host(host: string | { host: string; port?: number }, port?: number) {
    if (Types.isObject(host)) {
      port = host.port;
      host = host.host;
    }

    this.#createProps.host = host;
    if (/^[^:]*:\d+&/g.test(host) && !port) port = parseInt(host.split(':').pop() || '80');
    if (port) this.#createProps.port = port;
  }

  port(port: number) {
    if (port < 1 || port > 65535) throw new CoreError('Port must be between 1 and 65535');
    this.#createProps.port = port;
  }

  tls(key: string | { key: string; cert: string }, cert: string = '') {
    if (Types.isObject(key)) {
      cert = key.cert;
      key = key.key;
    }
    this.#validateTlsParams(key, cert);

    if (key.includes('/')) key = this.#loadFromFile(key, 'TLS key');
    if (cert.includes('/')) cert = this.#loadFromFile(cert, 'TLS cert');
    if (!key.includes('-----BEGIN')) throw new CoreError('TLS key must be a valid PEM string');
    if (!cert.includes('-----BEGIN')) throw new CoreError('TLS cert must be a valid PEM string');

    this.#createProps.tls = { key, cert };
  }

  bodySizeLimit(size: number | string) {
    if (Types.isString(size)) {
      const regex = /^(\d+)\s?([KMGT]?[B|b])?$/;
      const unitMultipliers: Record<string, number> = {
        b: 1,
        Kb: 1024,
        Mb: 1024 ** 2,
        Gb: 1024 ** 3,
        Tb: 1024 ** 4,
        B: 1 / 8,
        KB: 1024 / 8,
        MB: 1024 ** 2 / 8,
        GB: 1024 ** 3 / 8,
        TB: 1024 ** 4 / 8,
      };
      const match = size.match(regex);
      if (!match) throw new CoreError('Invalid body size limit format');

      const value = parseInt(match[1], 10);
      const unit = match[2]?.toUpperCase() ?? 'b';
      size = Math.floor(value * (unitMultipliers[unit] ?? 1));
    }

    if (size < 1) throw new CoreError('Body size limit must be greater than 0');
    if (Number.isNaN(size)) throw new CoreError('Body size limit must be a number');
    if (!Number.isInteger(size)) throw new CoreError('Body size limit must be an integer');
    this.#createProps.maxBodySize = size;
  }

  maxRequestCount(count: number) {
    if (count < 1) throw new Error('Max request count must be greater than 0');
    if (!Number.isInteger(count)) throw new Error('Max request count must be an integer');
    this.#createProps.requestPoolSize = count;
  }

  cors(...cors: string[]) {
    switch (true) {
      case cors.length === 0:
      case ['true', '1', 'yes', '*', true].includes(cors[0].toLowerCase()):
        // this.#createProps.cors = true;
        return;
      case ['false', '0', 'no'].includes(cors[0].toLowerCase()):
        // this.#createProps.cors = false;
        return;
      default:
        // this.#createProps.cors = cors;
        return;
    }
  }

  requestTimeout(timeout: number | string) {
    if (Types.isString(timeout)) {
      switch (true) {
        case /^(\d+)\s?ms$/i.test(timeout):
          timeout = parseInt(timeout, 10);
          break;
        case /^(\d+)\s?(s|sec|second|seconds)$/i.test(timeout):
          timeout = parseInt(timeout, 10) * 1000;
          break;
        case /^(\d+)\s?(m|min|minute|minutes)$/i.test(timeout):
          timeout = parseInt(timeout, 10) * 60 * 1000;
          break;
        case /^(\d+)\s?(h|hour|hours)$/i.test(timeout):
          timeout = parseInt(timeout, 10) * 60 * 60 * 1000;
          break;
        default:
          throw new CoreError('Invalid request timeout format');
      }
      if (Number.isNaN(timeout)) throw new CoreError('Invalid request timeout value');
      if (timeout < 1) throw new CoreError('Request timeout must be greater than 0');
      if (!Number.isInteger(timeout)) throw new CoreError('Request timeout must be an integer');
      if (timeout > 60 * 60 * 1000) throw new CoreError('Request timeout must be less than 1 hour');
      this.#createProps.requestTimeout = timeout;
    }
  }

  onError(handler: (err: Error, command: IHttpHandlerDescription) => OptionalPromise) {
    this.#createProps.onError = handler;
  }

  onNotFound(handler: (command: IHttpHandlerDescription) => OptionalPromise) {
    this.#createProps.onNotFound = handler;
  }

  routing(callback: IHttpRoutingDescription) {
    const routing = this.#createProps.routing;
    if (!routing) throw new CoreError('Routing is not initialized');
    const description = new HttpRoutingDescroptionProps('/');
    callback(description);
    routing.add(...description.handlers);
  }

  #validateTlsParams(key: string, cert: string) {
    if (!key || !cert) throw new CoreError('TLS key and cert must be provided');
    if (!Types.isString(key) || !Types.isString(cert) || key.trim() === '' || cert.trim() === '')
      throw new CoreError('TLS key and cert must be strings');
  }

  #loadFromFile(file: string, type: string) {
    if (!path.isAbsolute(file)) throw new CoreError(`${type} path must be absolute`);
    if (!fs.existsSync(file)) throw new CoreError(`${type} file does not exist`);

    const data = fs.readFileSync(file, 'utf-8');
    return data.trim();
  }
}

class HttpRoutingDescroptionProps implements IHttpRoutingDescriptionProps {
  mapping: string;
  handlers: RouteHandler[];
  get: IHandlerFunction;
  post: IHandlerFunction;
  put: IHandlerFunction;
  delete: IHandlerFunction;
  patch: IHandlerFunction;
  options: IHandlerFunction;
  head: IHandlerFunction;

  constructor(mapping: string) {
    this.mapping = mapping;
    this.handlers = [];

    this.get = this.#createMethodFactory(HttpMethod.GET);
    this.post = this.#createMethodFactory(HttpMethod.POST);
    this.put = this.#createMethodFactory(HttpMethod.PUT);
    this.delete = this.#createMethodFactory(HttpMethod.DELETE);
    this.patch = this.#createMethodFactory(HttpMethod.PATCH);
    this.options = this.#createMethodFactory(HttpMethod.OPTIONS);
    this.head = this.#createMethodFactory(HttpMethod.HEAD);
  }

  route(path: string, callback: IHttpRoutingDescription) {
    const routing = new HttpRoutingDescroptionProps(this.#createPath(path));
    callback(routing);
    this.handlers.push(...routing.handlers);
  }

  #createMethodFactory(httpMethod: IHttpMethodValue): IHandlerFunction {
    return (path: string | IHttpCommand, command?: IHttpCommand): OptionalPromise => {
      if (Types.isFunction(path)) {
        command = path;
        path = '';
      }
      if (!command) throw new CoreError('Command function must be provided');

      this.handlers.push({
        mapping: this.#createPath(path),
        httpMethod,
        command,
      });
    };
  }

  #createPath(path: string) {
    return `${this.mapping}${path.startsWith('/') ? '' : '/'}${path}`;
  }
}
