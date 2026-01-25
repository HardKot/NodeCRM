import { Space } from './space.js';
import { NODE_CONTEXT } from './code.js';
import { Container } from './container.js';
import { Module } from './module.js';
import { ObjectUtils, StringUtils, Types } from '../utils/index.js';
import EventEmitter from 'node:events';
import path from 'node:path';
import { Command } from './command.js';
import { Logger } from './logger.js';
import { SecurityService } from '../security/securityService.js';

const InstanceEvent = Object.freeze({
  BUILD: 'build',
  UPDATE: 'update',
});

class InstanceError extends Error {}

function moduleExportRuleDefault(name, source) {
  const nameCamel = StringUtils.factoryCamelCase(...name.split('.'));

  if (source[nameCamel]) return source[nameCamel];
  if (source.default) return source.default;
  return source;
}

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
    this.moduleExportRule = config.moduleExportRule ?? moduleExportRuleDefault;

    this.logger = new Logger({
      prefix: this.prefix,
      stdout: config.stdout,
      stderr: config.stderr,
    });
    this.extendes = config.extendes ?? [];
    this.commands = Object.freeze({});
  }

  async init() {
    this.container = await Container.create();

    this.space = await Space.watch({
      context: this.context,
      path: this.path,
      watchTimeout: this.watchTimeout,
    });

    for (const extend of this.extendes) {
      this.logger.info(`Loading extended ${extend.name}`);
      await extend.init?.(this);
    }
  }

  async build() {
    await this.#buildContainer();
    await this.#buildCommands();
    await Promise.all(this.extendes.map(it => it.build?.(this)));
    this.emit(InstanceEvent.BUILD);

    this.space.onChange(async () => {
      this.logger.info('Detected changes in space at', this.path);
      await this.#buildContainer();
      await this.#buildCommands();
      this.emit(InstanceEvent.UPDATE);
    });
  }

  async execute(path, body, session = new Map(), params = {}) {
    const runner = this.commands[path];
    if (Types.isNull(runner) || Types.isUndefined(runner))
      throw new InstanceError(`Consumer not found at path: ${path}`);

    return await runner.run(body, session, params);
  }

  getModule(name) {
    let moduleSource = this.space.get(name);
    moduleSource = this.moduleExportRule(name, moduleSource);
    if (!moduleSource) throw new InstanceError(`Module not found in space: ${name}`);

    return Module.parse(moduleSource, { name });
  }

  async #buildContainer() {
    const module = this.getModule('app.module');

    const components = this.extendes.map(it => it.components);

    this.container = await Container.create(
      [components, module.providers, module.consumers].flat()
    );
  }

  async #buildCommands() {
    const consumersEntries = await this.container.type('consumer');

    const handlers = [];
    for (const [name, consumer, meta] of consumersEntries) {
      if (Types.isFunction(consumer)) {
        handlers.push([name, new Command(consumer, meta)]);
      } else if (Types.isObject(consumer)) {
        for (const handlerName of ObjectUtils.getMethodNames(consumer)) {
          if (handlerName.startsWith('_')) continue;
          if (!Types.isFunction(consumer[handlerName])) continue;
          if (
            [
              'isPrototypeOf',
              'propertyIsEnumerable',
              'toString',
              'valueOf',
              'toLocaleString',
              'hasOwnProperty',
            ].includes(handlerName)
          )
            continue;

          const handler = consumer[handlerName].bind(consumer);
          handlers.push([`${name}.${handlerName}`, new Command(handler, meta)]);
        }
      }
    }

    this.commands = Object.fromEntries(handlers);
    Object.freeze(this.commands);
  }
}

export { Instance };
