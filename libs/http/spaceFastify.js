import Fastify from 'fastify';

import { SpaceModule } from '#core';
import { Types } from '#utils';

import { SpaceRequest } from './spaceRequest.js';
import { RouteBuilder } from './routeBuilder.js';

export { SpaceFastify };

class SpaceFastify extends SpaceModule {
  constructor(app) {
    super(app);

    this.prefix = `HTTP`;
    this.logger = this.extendsLoggerForFastify();
    this.routes = new Set();
    this.config = {
      port: 3000,
      host: '0.0.0.0',
      bodyLimit: 1024 * 1024,
      timeout: 60 * 1000,
      routerOptions: {},
      errorHandler: null,
      notFoundHandler: null,
    };

    this.app.injectDescription('server', this.descriptionServer.bind(this));
    this.app.injectEntrypoint('server.run', this.entrypointServer.bind(this));

    Object.freeze(this);
  }

  extendsLoggerForFastify() {
    const logger = this.app.logger.extend(`${this.app.prefix}[${this.prefix}]`);
    logger.fatal = logger.error.bind(logger);

    logger.child = (key, options) => {
      if (Object.keys(key).length === 0) return logger;
      const entry = Object.entries(key)[0];
      const child = logger.extend(`${this.app.prefix}[${this.prefix}#${entry[1]}]`, options);

      return child;
    };

    logger.transform = v => {
      if (!Types.isObject(v)) return v;
      const { req, res, responseTime } = v;
      if (req) return `IP: ${req.ip} ${req.method}: ${req.url}`;
      if (res) return `STATUS: ${res.statusCode} ${Math.floor(responseTime)}ms`;
      return v;
    };

    return logger;
  }

  createFastify() {
    const fastify = Fastify({
      connectionTimeout: this.config.timeout,
      bodyLimit: this.config.bodyLimit,
      loggerInstance: this.logger,
    });
    for (const route of this.routes) fastify.route(route);

    return fastify;
  }

  descriptionServer(callback) {
    const routingBuilder = new RouteBuilder({
      registration: (...args) => this.registrationHandler(...args),
    });

    callback({
      port: v => (this.config.port = v),
      host: v => (this.config.host = v),
      timeout: v => (this.config = v),
      bodyLimit: v => (this.config = v),
      routing: callback => routingBuilder.route(callback),
    });
  }

  async entrypointServer() {
    try {
      const fastify = this.createFastify();
      this.logger.info('Server routing:\n', fastify.printRoutes().trimEnd());
      await fastify.listen({ port: this.config.port, host: this.config.host });
    } catch (e) {
      this.logger.error(e);
    }
  }

  registrationHandler(options) {
    let description = options.handler;
    let handler = ({ code, send }) => {
      code(404);
      send();
    };
    let schema = {
      body: description.body ?? description.getBody?.(),
      params: description.params ?? description.getParams?.(),
      querystring: description.query ?? description.getQuery?.(),
      response: description.returns ?? description.getReturns?.(),
    };

    if (Types.isFunction(description)) handler = description;
    if (Types.isClass(description)) description = new handler(this.app);
    if (Types.isObject(description)) handler = description.run.bind(description);

    const handlerDescription = this.handlerDescription.bind(this);

    schema = Object.fromEntries(Object.entries(schema).filter(([_, v]) => v !== undefined));

    this.routes.add({
      url: options.mapping,
      method: options.method,
      handler: function (request, reply) {
        handler(handlerDescription(request, reply));
      },
      schema: schema,
    });
  }

  handlerDescription(req, reply) {
    const commandDescription = this.app.commandDescription();
    const state = new Map();

    return Object.freeze({
      request: new SpaceRequest(req),

      state: key => ({
        get: () => state.get(),
        set: value => state.set(key, value),
        remove: () => state.delete(key),
        has: () => state.has(key),
      }),

      setHttpCode: () => reply.code.bind(reply),
      getHttpCode: () => reply.statusCode,

      send: reply.send.bind(reply),
      redirect: reply.redirect.bind(reply),

      header: key => ({
        get: () => reply.getHeader(key),
        set: value => reply.setHeader(key, value),
        remove: () => reply.removeHeader(key),
        has: () => reply.hasHeader(key),
      }),

      setContentType: reply.type.bind(reply),
      getContentType: () => reply.getHeader('Content-Type'),

      cookie: value => reply.header('set-cookie', value),

      ...commandDescription,
    });
  }
}
