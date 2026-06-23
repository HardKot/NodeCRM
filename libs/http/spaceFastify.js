import Fastify from 'fastify';

import { SpaceModule } from '#core';
import { Types } from '#utils';

import { RouteBuilder } from './routeBuilder.js';
import { SpaceRequest } from './spaceRequest.js';

export { SpaceFastify };

class SpaceFastify extends SpaceModule {
  constructor(app) {
    super(app);

    this.fastify = Fastify({
      loggerInstance: this.app.logger.extends('HTTP'),
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
    this.description = () => ({
      port: v => (this.runConfig.port = v),
      host: v => (this.runConfig.host = v),
      routing: callback => routingBuilder.route(callback),
    });
    this.app.description['server'] = this.description;

    Object.freeze(this);
  }

  #registrationHandler(options) {
    let description = options.handler;
    let handler = ({ code, send }) => {
      code(404);
      send();
    };

    if (Types.isFunction(description)) handler = description;
    if (Types.isClass(description)) description = new handler(this.app);
    if (Types.isObject(description)) handler = description.run.bind(description);

    this.fastify.route({
      url: options.mapping,
      method: options.mapping,
      handler: (req, rep) => handler(this.#handlerDescription(req, rep)),
      schema: {
        body: description.body ?? description.getBody?.(),
        params: description.params ?? description.getParams?.(),
        querystring: description.query ?? description.getQuery?.(),
        response: description.returns ?? description.getReturns?.(),
      },
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
      redirect: reply.redirect.bind(redirect),

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
