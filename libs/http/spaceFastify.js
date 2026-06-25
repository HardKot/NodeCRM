import Fastify from 'fastify';

import { Types } from '#utils';

import { SpaceRequest } from './spaceRequest.js';
import { HttpSpace } from './httpSpace.js';

export { SpaceFastify };

class SpaceFastify extends HttpSpace {
  constructor(app) {
    super(app);

    this.logger.fatal = this.logger.error.bind(this.logger);
    this.logger.child = (key, options) => {
      if (Object.keys(key).length === 0) return this.logger;
      const entry = Object.entries(key)[0];
      const child = this.logger.extend(`${this.prefix}@${entry[1]}`, options);

      return child;
    };

    this.logger.test = 1;
    this.logger.transform = v => {
      if (!Types.isObject(v)) return v;
      if (v.req) {
        const raw = v.req.raw;
        return `${raw.method} ${raw.url}`;
      }
      if (v.res) {
        const raw = v.res.request;

        return `${raw.method} ${raw.url}`;
      }
      return v;
    };

    this.fastify = Fastify({
      loggerInstance: this.logger,
    });

    Object.freeze(this);
  }

  async run() {
    try {
      this.logger.info(this.fastify.printRoutes());
      await this.fastify.listen(this.config);
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

    this.fastify.route({
      url: options.mapping,
      method: options.method,
      handler: function(request, reply) {
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
