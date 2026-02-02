import { Container } from './container';
import { Module } from '../module';
import { EventEmitter } from 'node:events';
import { Command } from './command';
import { Logger } from './logger';
import { Result, Types } from '../../utils';
import { Plugins } from './plugins';
import { Session } from './session';
import { Metadata } from '../metadata';
import { ComponentType } from '../component';
import { SchemaRegistry } from '../schema';

interface InstanceConfig {
  stdout?: NodeJS.WriteStream;
  stderr?: NodeJS.WriteStream;
}

export type InstanceModule = Module | AsyncIterable<Module>;

const InstanceEvent = Object.freeze({
  BUILD: 'build',
  UPDATE: 'update',
});

class InstanceError extends Error {}

class Instance extends EventEmitter {
  private module: Module | null = null;
  private container: Container = new Container();
  private commands: Record<string, Command<any>> = {};

  constructor(
    moduleSource: InstanceModule,
    private readonly logger: Logger,
    public readonly plugins: Plugins[]
  ) {
    super();

    const module = this.linkModule(moduleSource);
    if (!module) this.module = module;
  }

  async build() {
    await this.buildContainer();
    await this.buildCommands();
    await this.buildPlugins();
    this.emit(InstanceEvent.BUILD);
  }

  async execute(path: string, body: any, session = new Session(), params = {}) {
    const runner = this.commands[path];
    if (Types.isNull(runner) || Types.isUndefined(runner)) {
      return Result.failure(new InstanceError(`Consumer not found at path: ${path}`));
    }

    return await runner.run(body, session, params);
  }

  private async subscribeToModuleChanges(source: AsyncIterable<Module>) {
    for await (const module of source) {
      this.module = this.linkModule(module);
    }
  }
  private linkModule(source: InstanceModule) {
    if (Types.isAsyncIterator(source)) {
      this.subscribeToModuleChanges(source).catch((err: Error) => this.logger.error(err));
      return null;
    }
    return this.module;
  }
  private combineComponents(module: Module, plugins: Plugins[]) {
    const pluginComponents = plugins.map(it => it.components ?? []).flat();

    return [pluginComponents, module.providers, module.consumers].flat();
  }

  private async buildContainer() {
    if (Types.isNull(this.module))
      return this.logger.warn('Module is null, skipping container build...');
    const components = this.combineComponents(this.module, this.plugins);

    this.logger.info(`Building container with ${components.length} components...`);
    this.container = await Container.create(components);
  }
  private async buildCommands() {
    const consumersEntries = await this.container.type(ComponentType.CONSUMER);

    let handlers: [string | symbol, Command<any>][] = [];
    for (const consumer of consumersEntries) {
      if (Types.isFunction(consumer.instance)) {
        handlers.push([
          consumer.name,
          Command.createFromFunction(
            consumer.instance,
            consumer.metadata ?? new Metadata(),
            new SchemaRegistry()
          ),
        ]);
      }
      if (Types.isObject(consumer.instance)) {
        handlers = handlers.concat(
          Command.createFromObject(
            consumer.instance,
            consumer.metadata ?? new Metadata(),
            new SchemaRegistry()
          ).map(it => [`${consumer.name.toString()}.${it[0]}`, it[1]])
        );
      }
    }
    this.commands = Object.fromEntries(handlers);
    this.logger.info(`Building commands with ${handlers.length} handlers...`);

    Object.freeze(this.commands);
  }
  private async buildPlugins() {
    await Promise.all(this.plugins.map(it => it.build?.(this)));
  }
}

export { Instance, InstanceEvent, InstanceError };
