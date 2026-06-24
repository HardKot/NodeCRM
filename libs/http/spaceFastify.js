import { IncomingMessage } from 'node:http';

import Fastify from 'fastify';

import { SpaceModule } from '#core';
import { Types } from '#utils';

import { RouteBuilder } from './routeBuilder.js';
import { SpaceRequest } from './spaceRequest.js';

export { SpaceFastify };

class SpaceFastify extends SpaceModule {
  constructor(app) {
    super(app);

    this.prefix = 'HTTP';
    this.logger = this.app.logger.extend(this.prefix);
    this.logger.fatal = this.logger.error.bind(this.logger);
    this.logger.child = (key, options) => {
      if (Object.keys(key).length === 0) return this.logger;
      const entry = Object.entries(key)[0];
      return this.logger.extend(`${this.prefix}@${entry[0]} = ${entry[1]}`, options);
    };

    this.fastify = Fastify({
      loggerInstance: this.logger,
    });

    this.runConfig = {
      port: 3000,
      host: '0.0.0.0',
      bodyLimit: 1024 * 1024,
      timeout: 60 * 1000,
    };

    const routingBuilder = new RouteBuilder({
      registration: this.#registrationHandler.bind(this),
    });
    this.description = {
      port: v => (this.runConfig.port = v),
      host: v => (this.runConfig.host = v),
      routing: callback => routingBuilder.route(callback),
    };
    this.app.description['server'] = callback => callback(this.description);

    Object.freeze(this);
  }

  async run() {
    try {
      this.logger.info(this.fastify.printRoutes());
      await this.fastify.listen(this.runConfig);
    } catch (e) {
      this.logger.error(e);
    }
  }

  #registrationHandler(options) {
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
    const handlerDescription = this.#handlerDescription.bind(this);

    schema = Object.fromEntries(Object.entries(schema).filter(([_, v]) => v !== undefined));

    this.fastify.route({
      url: options.mapping,
      method: options.method,
      handler: function(request, reply) {
        handler(handlerDescription(request, reply));
      },
      schema: schema,
    });
  }

  #handlerDescription(req, reply) {
    const state = new Map();

    return Object.freeze({
      request: new SpaceRequest(req),

      value: state.set.bind(state),
      getValue: state.get.bind(state),
      removeValue: state.delete.bind(state),
      hasValue: state.has.bind(state),

      code: reply.code.bind(reply),
      getCode: () => reply.statusCode,

      send: reply.send.bind(reply),
      redirect: reply.redirect.bind(reply),

      header: reply.header.bind(reply),
      getHeader: reply.getHeader.bind(reply),
      removeHeader: reply.removeHeader.bind(reply),
      hasHeader: reply.hasHeader.bind(reply),

      type: reply.type.bind(reply),
      getType: () => reply.getHeader('Content-Type'),

      cookie: value => reply.header('set-cookie', value),
    });
  }
}
