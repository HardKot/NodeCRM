import { Logger } from './logger.js';
import os from 'node:os';
import cluster from 'node:cluster';
import { Space } from './space.js';
import { NODE_CONTEXT } from './code.js';

class App {
  constructor(config = {}) {
    this.logger = new Logger({ prefix: 'App' });
    this.workers = new Set();
    this.config = config;
  }

  async master() {
    const numCPUs = os.availableParallelism();
    this.logger.info(`Master process is running with ${numCPUs} CPUs`);

    for (const cpu of numCPUs) {
      const worker = cluster.fork();
      this.workers.add(worker);
      this.logger.info(`Forked worker #${cpu} pid: ${worker.process.pid}`);
    }
  }

  async fork() {
    const space = await Space.watch({
      context: Object.assign({ ...NODE_CONTEXT, console: this.logger }, this.config.context ?? {}),
      path: this.config.path,
      watchTimeout: this.config.watchTimeout,
    });

    space.onChange(() => {
      this.logger.info('Detected changes in space at', space.path);
    });
  }
}

export { App };
