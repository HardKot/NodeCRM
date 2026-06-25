import { CoreError, SpaceModule } from '#core';
import { RouteBuilder } from './routeBuilder.js';

export { HttpSpace };

class HttpSpace extends SpaceModule {
  constructor(app) {
    super(app);

    this.prefix = 'HTTP';
    this.logger = this.app.logger.extend(this.prefix);

    this.config = {
      port: 3000,
      host: '0.0.0.0',
      bodyLimit: 1024 * 1024,
      timeout: 60 * 1000,
    };

    const routingBuilder = new RouteBuilder({
      registration: (...args) => this.registrationHandler(...args),
    });

    this.app.injectDescription('server', callback =>
      callback({
        port: v => (this.config.port = v),
        host: v => (this.config.host = v),
        timeout: v => (this.config = v),
        bodyLimit: v => (this.config = v),
        routing: callback => routingBuilder.route(callback),
      })
    );
  }

  async run() {
    throw new CoreError('HttpSpace.run is not implementation');
  }

  registrationHandler(options) {
    throw new CoreError('HttpSpace.registrationHandler is not implementation');
  }

  handlerDescription(request) {
    const commandDescription = this.app.commandDescription();
    return {
      request,
      code: value => value,

      send: async value => { },
      redirect: async value => { },

      header: key => ({
        get: () => null,
        set: value => { },
        remove: () => { },
        has: () => false,
      }),

      type: value => value,
      cookie: value => { },
      ...commandDescription,
    };
  }
}
