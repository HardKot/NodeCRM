import os from 'node:os';
import cluster from 'node:cluster';

import { Space } from './space.js';
import { NODE_CONTEXT } from './code.js';
import { Container } from './container.js';
import { Module } from './module.js';
import { ObjectUtils, Types } from '../utils/index.js';

class InstanceError extends Error {}

class Instance {
  static async run(config = {}) {
    const instance = new Instance(config);
    if (cluster.isPrimary) {
      await instance.master();
    } else {
      await instance.fork();
    }
    return instance;
  }

  constructor(config = {}) {
    this.prefix = 'App';
    if (cluster.isWorker) this.prefix += `:Worker-${cluster.worker.id}`;

    this.context = Object.assign({}, NODE_CONTEXT, this.context);
    this.watchTimeout = config.watchTimeout ?? 500;
    this.logger = config.logger ?? console;
    this.path = config.path ?? process.cwd();
    this.extendes = config.extendes ?? [];
    this.consumers = {};
  }

  async master() {
    const workers = new Set();
    const numCPUs = os.availableParallelism();
    this.logger.info(`Master process is running with ${numCPUs} CPUs`);

    for (const cpu of numCPUs) {
      const worker = cluster.fork();
      workers.add(worker);
      this.logger.info(`Forked worker #${cpu} pid: ${worker.process.pid}`);
    }
  }

  async fork() {
    this.container = await Container.create();
    this.space = await Space.watch({
      context: this.context,
      path: this.path,
      watchTimeout: this.watchTimeout,
    });

    for (const extend of this.extendes) {
      this.logger.info(`Loading extended ${extend.name}`);
      await extend.extend(this);
    }

    await this.#buildAppModule();

    this.space.onChange(() => {
      this.logger.info('Detected changes in space at', this.path);
      this.#buildAppModule();
    });
  }

  async execute(path, ...args) {
    const runner = ObjectUtils.goTo(this.consumers, path, null);
    if (Types.isNull(runner) || Types.isUndefined(runner))
      throw new InstanceError(`Consumer not found at path: ${path}`);
    if (!Types.isFunction(runner))
      throw new InstanceError(`Consumer at path is not a function: ${path}`);

    return await runner(...args);
  }

  async #buildAppModule() {
    const moduleSource = this.space.get('app.module');
    if (!moduleSource) throw new InstanceError('App module not found in space');

    const module = Module.parse(moduleSource);

    for (const provider of module.providers) {
      if (!provider.type) provider.type = 'provider';
    }
    for (const consumer of module.consumers) {
      if (!consumer.type) consumer.type = 'consumer';
    }

    this.container = await Container.create([module.providers, module.consumers].flat());
    const consumersEntries = await this.container.type('consumer');
    this.consumers = Object.fromEntries(consumersEntries);
    Object.freeze(this.consumers);

    // TODO: отправка сигнала о готовности consumers
  }
}

export { Instance };
