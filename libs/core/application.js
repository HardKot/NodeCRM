import * as path from 'node:path';
import * as cluster from 'node:cluster';

import { Logger } from './logger.js';
import { Config } from './config.js';
import { Container } from './container.js';
import { BeanRegistry } from './beanRegistry.js';
import { HttpServer } from '../httpServer/httpServer.js';

class Application {
  constructor(stdout, stderr) {
    this.prefix = `Instance@${path.dirname(process.cwd())}`;
    if (cluster.isWorker) this.prefix = `Worker#${cluster.worker?.id}`;

    this.logger = new Logger(this.prefix, stdout, stderr);

    this.container = new Container(this);
    this.beanRegistry = new BeanRegistry(this);
    this.config = new Config(this);
    this.server = new HttpServer(this);
    this.router = this.server.router;

    Object.freeze(this);
  }
}

export { Application };
