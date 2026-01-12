import events from 'node:events';
import { AppSpace } from './appSpace.js';
import { Logger } from '../core/logger.js';
import { AppConfig } from './appConfig.js';
import { SchemaModule } from '../schema';
import { setImmediate } from 'node:timers';
import { ComponentContainerModule } from '../componentContainer';

class Application extends events.EventEmitter {
  constructor() {
    super();

    this.path = process.cwd();
    this.logger = new Logger(this);
    this.config = new AppConfig(this);
    this.space = new AppSpace(this);
    this.components = new ComponentContainerModule(this);
    this.schemas = new SchemaModule();

    Object.freeze(this);
  }

  async bootstrap() {
    const { logger, config, space } = this;

    await logger.bootstrap?.();
    await config.bootstrap?.();
    await space.bootstrap?.();
  }

  registerModule(...modules) {
    const self = this;
    const { components, schemas } = this.prepareModule(...modules);

    setImmediate(() => {
      self.components.load.apply(self.components, components);
      self.schemas.load.apply(self.schemas, schemas);
    });
  }

  prepareModule(...modules) {
    return {
      components: modules
        .map(module => [module.components, module.services, module.controllers])
        .flat(2),

      schemas: modules.map(module => module.schemas).flat(),

      entrypoint: modules.map(module => module.entrypoints).flat(),
    };
  }

  getConfig(name, defaultValue) {
    return name.split('.').reduce((value, key) => value?.[key], this.config) ?? defaultValue;
  }
}

export { Application };
