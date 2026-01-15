import os from 'node:os';
import cluster from 'node:cluster';

import { Space } from './space.js';
import { NODE_CONTEXT } from './code.js';
import { Container } from './container.js';
import { ParserModule } from './parsers/parserModule.js';
import { Types } from '../utils';

class InstanceError extends Error {}

class Instance {
  constructor(config = {}) {
    this.prefix = 'App';
    if (cluster.isWorker) this.prefix += `:Worker-${cluster.worker.id}`;

    this.context = Object.assign({}, NODE_CONTEXT, this.context);
    this.watchTimeout = config.watchTimeout ?? 500;
    this.logger = config.logger ?? console;
    this.path = config.path ?? process.cwd();
    this.extendes = config.extendes ?? [];
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
    this.parser = new ParserModule();
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

  measureMemory() {
    const memoryUsage = process.memoryUsage();
    return {
      rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
      heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`,
    };
  }

  #moduleResolve(moduleSource) {
    if (Types.isString(moduleSource)) {
      moduleSource = this.space.get(moduleSource);
      if (!moduleSource) throw new InstanceError(`Module "${moduleSource}" not found in space`);
    }
    const module = this.parser.parse(moduleSource);

    const instance = module.factory(this);
    let providers = new Set();
    let controllers = new Set();

    if (Types.isFunction(module.providers)) {
      providers = new Set(module.providers(instance));
    } else if (Array.isArray(module.providers)) {
      providers = new Set(module.providers);
    }

    if (Types.isFunction(module.controllers)) {
      controllers = new Set(module.controllers(instance));
    } else if (Array.isArray(module.controllers)) {
      controllers = new Set(module.controllers);
    }

    for (const provider of [providers, controllers].flat()) {
      provider.module = instance;
    }

    for (const importedModuleSource of module.imports) {
      const importedModule = this.#moduleResolve(importedModuleSource);

      importedModule.providers.forEach(it => providers.add(it));
      importedModule.controllers.forEach(it => controllers.add(it));
    }

    return {
      providers,
      controllers,
    };
  }

  async #buildAppModule() {
    const moduleSource = this.space.get('app.module');
    if (!moduleSource) throw new InstanceError('App module not found in space');

    const { providers, controllers } = this.#moduleResolve(moduleSource);

    for (const provider of providers) provider.type = 'provider';
    for (const controller of controllers) {
      controller.type = 'controller';
    }

    this.container = await Container.create(
      [providers.values().toArray(), controllers.values().toArray()].flat()
    );
    this.logger.info(
      'Application module loaded with',
      providers.length,
      'providers and',
      controllers.length,
      'controllers'
    );
  }

  static async run(config = {}) {
    const instance = new Instance(config);
    if (cluster.isPrimary) {
      await instance.master();
    } else {
      await instance.fork();
    }
    return instance;
  }
}

export { Instance };
