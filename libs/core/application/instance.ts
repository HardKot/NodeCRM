import { Container } from './container';
import { Module } from '../module';
import { EventEmitter } from 'node:events';
import { Command } from './command';
import { Logger } from '../logger';
import { Result, ObjectUtils, Types } from '../../utils';
import { Plugins } from './plugins';

interface InstanceConfig {
  stdout?: NodeJS.ReadWriteStream;
  stderr?: NodeJS.ReadWriteStream;
}

type InstanceModule = Module | AsyncIterable<Module>;

const InstanceEvent = Object.freeze({
  BUILD: 'build',
  UPDATE: 'update',
});

class InstanceError extends Error {}

class Instance extends EventEmitter {
  // static async run(config = {}) {
  //   const instance = new Instance(config);
  //   await instance.init();
  //   await instance.build();
  //   return instance;
  // }

  private logger: Logger;
  private container: Container = new Container();
  private commands: Record<string, Command<any>> = {};

  constructor(
    public readonly module: InstanceModule,
    public readonly prefix: string = 'Instance',
    public readonly plugins: Plugins[] = [],
    config: Partial<InstanceConfig> = {}
  ) {
    super();

    this.logger = new Logger({
      prefix: this.prefix,
      stdout: config.stdout,
      stderr: config.stderr,
    });

    this.linkModule(this.module);
  }

  async init() {
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
  }

  async execute(path, body, session = new Map(), params = {}) {
    const runner = this.commands[path];
    if (Types.isNull(runner) || Types.isUndefined(runner)) {
      return Result.failure(new InstanceError(`Consumer not found at path: ${path}`));
    }

    return await runner.run(body, session, params);
  }

  private linkModule(source: InstanceModule) {
    if (Types.isAsyncIterator(source)) return;

    const components = [
      source.consumers,
      source.providers,
      ...this.plugins.map(it => it.components ?? []),
    ].flat(1);

    this.logger.info(`Building container with ${components.length} components...`);
    this.container = Container.create(components);
  }

  async #buildContainer() {
    if (!this.module) throw new InstanceError(`Module not found`);
    const module = Module.parse(this.module, { name: 'app.module' });

    const pluginComponents = this.plugins.map(it => it.components ?? []).flat();
    const components = [pluginComponents, module.providers, module.consumers].flat();
    this.logger.info(`Building container with ${components.length} components...`);
    this.container = await Container.create(components);
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
    this.logger.info(`Building commands with ${handlers.length} handlers...`);
    Object.freeze(this.commands);
  }

  #extractModule(source) {
    if (Types.isObject(source) && Types.isFunction(source.onChange) && 'current' in source) {
      source.onChange(async () => {
        this.logger.info('Module source changed, rebuilding instance...');
        this.module = source.current;
        await this.#buildContainer();
        await this.#buildCommands();
        this.emit(InstanceEvent.UPDATE);
      });
      return source.current;
    }
    if (Types.isObject(source) || Types.isFunction(source) || Types.isClass(source)) return source;

    throw new InstanceError(
      `Invalid module configuration, supported types are: object, function, object with onChange method`
    );
  }
}

module.exports = { Instance, InstanceEvent, InstanceError };
