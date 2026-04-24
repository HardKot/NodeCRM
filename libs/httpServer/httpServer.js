const http2 = require('node:http2');
const utils = require('node:util');
const events = require('node:events');

const { Router } = require('./router');
const { HttpServerError } = require('./httpServerError');

const { Types } = require('../utils');

const HOOKS = Object.freeze({
  onRequest: 0,
  preHandler: 1,
  onResponse: 2,
  onError: 3,

  onRoute: 6,
  onListen: 7,
  onClose: 8,
  preClose: 9,
});

class HttpServer {
  constructor(app) {
    this.app = app;
    this.requests = new Set();
    this.router = new Router();
    this.eventEmitter = new events.EventEmitter();

    const config = this.app;
    this.port = config.getValue('http.port', 8443);
    this.host = config.getValue('http.host', '0.0.0.0');

    this.contentType = config.getValue('http.contentType', [
      'application/json',
      'application/octet-stream',
    ]);
    if (!Array.isArray(this.contentType)) this.contentType = [this.contentType];

    const tls = config.getValue('http.tls');
    const requestTimeout = config.getValue('http.timeout', 60);
    const maxRequest = config.getValue('http.maxRequest', 60_000);

    this.server = http2.createSecureServer({
      allowHTTP1: true,
      key: tls.key,
      cert: tls.cert,
    });
    this.server.setTimeout(requestTimeout * 1000);
    this.server.on('request', async (req, res) => {
      if (this.requests.size >= maxRequest) {
        res.statusCode = 429;
        res.end();
      }
      const combine = [req, res];
      this.requests.add(combine);
      res.on('close', () => {
        this.requests.delete(combine);
      });
      this.#onRequest(req, res);
    });

    Object.freeze(this);
  }

  async start() {
    await utils.promisify(this.server.listen.bind(this.server))(this.port);
    this.eventEmitter.emit(HOOKS.onListen, this);
    this.app.logger.info(`HTTP Server running at https://${this.host}:${this.port}/`);
    Object.freeze(this.hooks);
  }

  async stop() {
    this.eventEmitter.emit(HOOKS.preClose, this);
    await utils.promisify(this.server.close.bind(this.server))();
    this.eventEmitter.emit(HOOKS.onClose, this);
    this.app.logger.info('HTTP Server stopped');
  }

  addHook(name, fn) {
    if (!Types.isFunction(fn)) throw new HttpServerError('Hook must be a function');
    if (!HOOKS.hasOwnProperty(name)) throw new HttpServerError(`Invalid hook name: ${name}`);
    this.eventEmitter.on(HOOKS[name], fn);
  }

  /**
   *
   * @param {http2.Http2ServerRequest} req
   * @param {http2.Http2ServerResponse} res
   */
  async #onRequest(req, res) {
    const request = new Request(req);
    const response = new Response(res);
    let args = Object.freeze({ request, response });

    try {
      this.eventEmitter.emit(HOOKS.onRequest, this, request, response);

      this.app.logger.info(`Incoming request: ${request.method} ${request.pathname}`);

      const routerNode = this.router.route(request.pathname, request.method);
      if (!routerNode) return await this.router.notFound(args);

      args = Object.freeze({ ...args, params: routerNode.extractParams(request.pathname) });

      this.eventEmitter.emit(HOOKS.preHandler, this, request, response);

      await routerNode.handler(args);
    } catch (e) {
      this.eventEmitter.emit(HOOKS.onError, this, e);
      await this.router.error(args);
    } finally {
      response.safeClose();
    }
  }
}

class Request {
  /** @type {http2.Http2ServerRequest} */
  #requst;

  constructor(request) {
    this.#requst = request;

    const { method, headers, url } = request;
    const [pathname, searchStr] = url.split('?');

    this.pathname = pathname;
    this.search = searchParamsToObject(searchStr || '');
    this.params = {};
    this.method = method;
    this.headers = headers;

    Object.freeze(this);
  }

  getContentType() {
    return this.#requst.headers['content-type']?.split(';')[0]?.toLowerCase() ?? '';
  }

  data() {
    return new Promise((res, rej) => {
      const data = [];
      this.#requst.on('data', v => {
        data.push(v);
      });

      this.#requst.on('error', e => rej(e));
      this.#requst.on('end', () => {
        if (data.filter(it => !Types.isString(it)).length) return data.concat('');
        return Buffer.concat(data);
      });
    });
  }
}

class Response {
  #options = {};
  /** @type {http2.Http2ServerResponse} */
  #response;

  constructor(response) {
    this.#response = response;
    this.#options = {
      statusCode: 200,
      contentType: 'application/json',
      headers: {},
      cookies: [],
      data: null,
    };
    Object.freeze(this);
  }

  getStatusCode() {
    return this.#options.statusCode;
  }

  setStatusCode(v) {
    this.#options.statusCode = v;
  }

  addHeader(name, value) {
    this.#options.headers[name] = value?.toString() ?? `${value}`;
  }

  getHeaders() {
    return { ...this.#options.headers };
  }

  json(v) {
    this.#options.contentType = 'application/json';
    this.#options.data = JSON.stringify(v);
  }

  async send() {
    if (this.#response.closed) throw new HttpServerError('Response is closed');
    const options = this.#options;
    const response = this.#response;

    response.statusCode = options.statusCode;
    for (const header in options.headers) response.setHeader(header, options.headers[header]);
    response.setHeader('Content-Type', options.contentType);

    response.setHeader(
      'set-cookie',
      options.cookies.map(it => {
        let value = `${it.name}=${it.value}`;
        if (it.path) value += `; Path=${it.path}`;
        if (it.age) value += `; Max-Age=${it.age}`;
        if (it.http) value += `; HttpOnly`;
        return value;
      })
    );

    if (!options.data) return response.end();
    response.end(options.data);
  }

  async safeClose() {
    if (this.#response.closed) return;
    await this.send();
  }
}

function searchParamsToObject(searchStr) {
  const search = {};
  for (const searStr of searchStr.split('&')) {
    let [key, value] = searStr.split('=');
    if (!key.endsWith('[]')) {
      search[key] = value;
      continue;
    }
    key = key.slice(0, -2);
    if (!search[key]) search[key] = [];
    search[key].push(value);
  }
  return search;
}

exports.HttpServer = HttpServer;
