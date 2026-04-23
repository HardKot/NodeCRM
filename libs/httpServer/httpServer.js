const http2 = require('node:http2');
const utils = require('node:util');
const events = require('node:events');

const { Router } = require('./router');
const { HttpServerError } = require('./httpServerError');

const { Types } = require('../utils');

const HOOKS = Object.freeze({
    onRequest: 0,
    preHandler:1,
    onResponse: 2,
    onError: 3,
    sessionCreated: 4,
    sessionClosed: 5,

    onRoute: 6,
    onListen: 7,
    onClose: 8,
    preClose: 9,
})

class HttpServer {
    constructor(app) {
        this.app = app;
        this.session = new Set();
        this.router = new Router();
        this.eventEmitter = new events.EventEmitter();

        const config = this.app;
        this.port = config.getValue("http.port", 8443);
        this.host = config.getValue("http.host", '0.0.0.0');

        this.maxSession  = config.getValue("http.maxSession", 1000);
        this.bodyLimit   = config.getValue("http.bodyLimit", 1024 * 1024 * 10);
        this.contentType = config.getValue("http.contentType", ["application/json", "application/octet-stream"]);
        if (!Array.isArray(this.contentType)) this.contentType = [this.contentType];

        const tls            = config.getValue("http.tls");
        const requestTimeout = config.getValue("http.timeout", 60);

        this.server = http2.createSecureServer({
            allowHTTP1: true,
            key: tls.key,
            cert: tls.cert,
        });
        this.server.setTimeout(requestTimeout * 1000);
        this.server.on('request', (req, res) => this.#onRequest(req, res));
        this.server.on('session', (session) => this.#onSession(session));

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
            
            args = Object.freeze({ ...args, params: routerNode.extractParams(request.pathname)});
            
            this.eventEmitter.emit(HOOKS.preHandler, this, request, response);
        
            await routerNode.handler(args);
        } catch (e) {
            this.eventEmitter.emit(HOOKS.onError, this, e);
            await this.router.error(args);
        } finally {
            response.safeClose();
        }
    }

    #onSession(session) {
        if (this.maxSession.size >= this.maxSession) {
            session.close();
            return;
        }
        this.session.add(session);
        this.eventEmitter.emit(HOOKS.sessionCreated, this, session);
        session.on('close', () => {
            this.session.delete(session);
            this.eventEmitter.emit(HOOKS.sessionClosed, this, session);
        });
    }
}

class Request {
    constructor(request) {
        const { method, headers, url } = request;
        const [pathname, searchStr] = url.split('?');

        this.pathname = pathname;
        this.search = searchParamsToObject(searchStr || '');
        this.params = {};
        this.method = method;
        this.headers = headers;

        Object.freeze(this);
    }
}

class Response {
    constructor(response) {
        
        Object.freeze(this);
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