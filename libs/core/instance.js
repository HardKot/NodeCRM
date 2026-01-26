const { Space } = require('./space.js');
const { NODE_CONTEXT } = require('./code.js');
const { Container } = require('./container.js');
const { Module } = require('./module.js');
const { ObjectUtils, Types, StringUtils } = require('../utils/index.js');
const EventEmitter = require('node:events');
const path = require('node:path');
const { Command } = require('./command.js');
const { Logger } = require('./logger.js');

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
    this.plugins = config.plugins ?? [];
    this.commands = Object.freeze({});
  }

  async init() {
    this.container = await Container.create();

    if (this.watchTimeout <= 0) {
      this.space = await Space.load({
        context: this.context,
        path: this.path,
      });
    } else {
      this.space = await Space.watch({
        context: this.context,
        path: this.path,
        watchTimeout: this.watchTimeout,
      });
    }

    for (const extend of this.plugins) {
      this.logger.info(`Loading extended '${extend.name}'`);
      await extend.init?.(this);
    }
  }

  async build() {
    await this.#buildContainer();
    await this.#buildCommands();
    await Promise.all(this.plugins.map(it => it.build?.(this)));
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

  async #buildContainer() {
    let moduleSource = this.space.get('app.module');
    moduleSource = this.moduleExportRule('app.module', moduleSource);
    if (!moduleSource) throw new InstanceError(`Module not found in space: 'app.module'`);

    const module = Module.parse(moduleSource, { name: 'app.module' });

    const components = this.plugins.map(it => it.components ?? []).flat();

    this.container = await Container.create(
      [components, module.providers, module.consumers].flat()
    );
  }

  async #buildCommands() {
    const consumersEntries = await this.container.type('consumer');

    const handlers = [];
    for (const { name, instance, meta } of consumersEntries) {
      if (Types.isFunction(instance)) {
        handlers.push([name, new Command(instance, meta)]);
      } else if (Types.isObject(instance)) {
        for (const handlerName of ObjectUtils.getMethodNames(instance)) {
          if (handlerName.startsWith('_')) continue;
          if (!Types.isFunction(instance[handlerName])) continue;
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

          const handler = instance[handlerName].bind(instance);
          handlers.push([`${name}.${handlerName}`, new Command(handler, meta)]);
        }
      }
    }
    this.commands = Object.fromEntries(handlers);
    Object.freeze(this.commands);
  }
}

module.exports = { Instance, InstanceEvent, InstanceError };
