import events from 'node:events';
import { AppSpace } from './appSpace.js';
import { AppLogger } from './appLogger.js';
import { AppConfig } from './appConfig.js';

class Application extends events.EventEmitter {
  constructor() {
    super();

    this.path = process.cwd();
    this.components = {};

    Object.freeze(this);
  }

  get logger() {
    return this.components.logger;
  }

  get config() {
    return this.components.config.config;
  }

  get space() {
    return this.components.space;
  }

  async loadComponents() {
    this.components = {
      logger: new AppLogger(this),
      config: new AppConfig(this),
      space: new AppSpace(this),
    };

    await this.components.config.bootstrap();
    await this.components.space.bootstrap();
  }

  bootstrap() {
    return this.space.bootstrap();
  }

  getConfig(name, defaultValue) {
    return name.split('.').reduce((value, key) => value?.[key], this.config) ?? defaultValue;
  }
}

export { Application };
