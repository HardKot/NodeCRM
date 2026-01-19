import { Space } from './space.js';
import { NODE_CONTEXT } from './code.js';
import { Container } from './container.js';
import { Module } from './module.js';
import { ObjectUtils, Types } from '../utils/index.js';
import EventEmitter from 'node:events';
import path from 'node:path';

const InstanceEvent = Object.freeze({
  BUILD: 'build',
  UPDATE: 'update',
});

class InstanceError extends Error {}

class Instance extends EventEmitter {
  static async run(config = {}) {
    const instance = new Instance(config);
    await instance.init();
    await instance.build();
    return instance;
  }

  constructor(config = {}) {
    super();

    this.context = Object.assign({}, NODE_CONTEXT, this.context);
    this.watchTimeout = config.watchTimeout ?? 500;
    this.path = config.path ?? process.cwd();
    this.prefix = config.prefix ?? `Instance@${path.relative(this.path, process.cwd())}`;
    this.extendes = config.extendes ?? [];
    this.consumers = {};
  }

  async init() {
    this.container = await Container.create();

    this.space = await Space.watch({
      context: this.context,
      path: this.path,
      watchTimeout: this.watchTimeout,
    });

    for (const extend of this.extendes) {
      console.info(this.prefix, `Loading extended ${extend.name}`);
      await extend.init?.(this);
    }
  }

  async build() {
    await this.#buildModules();
    await Promise.all(this.extendes.map(it => it.build?.(this)));
    this.emit(InstanceEvent.BUILD);

    this.space.onChange(() => {
      console.info(this.prefix, 'Detected changes in space at', this.path);
      this.#buildModules();
      this.emit(InstanceEvent.UPDATE);
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

  async #buildModules() {
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
  }
}

export { Instance };
