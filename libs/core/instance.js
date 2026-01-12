import { Space } from './space.js';
import { NODE_CONTEXT } from './code.js';
import { Logger } from './logger.js';
import { Container } from './container.js';

class Instance {
  constructor(config = {}) {
    this.context = Object.assign({}, NODE_CONTEXT, config.context ?? {});
    this.logger = new Logger();
    this.context.console = this.logger;
    this.space = new Space({ context: this.context });
    this.container = new Container();

    this.space.onPreLoad(() => {
      this.logger.info('Loading modules from space at', this.space.path);
    });

    this.space.onPostLoad(async () => {
      this.logger.info('Loaded modules from space at', this.space.path);
      this.container = await Container.create([], {
        controllers: this.space.type('controller'),
        resolves: this.space.type('resolve'),
      });
    });
  }
}

export { Instance };
