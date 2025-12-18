import events from 'node:events';
import { AppSpace } from './appSpace.js';
import { AppConfig } from './appConfig.js';

class Application extends events.EventEmitter {
  constructor() {
    super();

    this.path = process.cwd();

    this.config = new AppConfig(this);
    this.space = new AppSpace(this);

    Object.freeze(this);
  }

  async load() {
    await this.config.load();
    await this.space.load();
  }
}

export { Application };
