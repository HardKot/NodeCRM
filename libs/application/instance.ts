import { Container } from './container';
import { Module, Component, ComponentType, Metadata } from '../core';
import { EventEmitter } from 'node:events';
import { Command, CommandBodyType, CommandReturnsType } from './command';
import { Logger } from './logger';
import { Result, Types } from '../utils';
import { Plugin } from './plugin';
import { Session } from './session';
import { SchemaRegistry } from '../schema';

const InstanceEvent = Object.freeze({
  BUILD: 'build',
  UPDATE: 'update',
});

export type InstanceModule = Module | AsyncIterable<Module>;

export type ExecCommand = (path: string, body: any, session?: Session, params?: Record<string, any> | null) => Promise<Result<any>>;
type InstanceEventType = (typeof InstanceEvent)[keyof typeof InstanceEvent];

export interface IInstance {
  execute: ExecCommand;
  commandsList: Readonly<Array<CommandInfo>>;
  on(event: InstanceEventType, listener: () => void): void;
}


export interface CommandInfo {
  name: string;
  body: CommandBodyType | null;
  returns: CommandReturnsType | null;
  params: Record<string, any> | null;
  metadata: Metadata;

  description?: string;
}

class InstanceError extends Error {}

class Instance extends EventEmitter implements IInstance {
  public static async create(
    moduleSource: InstanceModule | Promise<InstanceModule>,
    logger: Logger,
    plugins: Plugin[] = []
  ) {
    if (Types.isPromise(moduleSource)) {
      moduleSource = await moduleSource;
    }
    const instance = new Instance(moduleSource, logger, plugins);
    await instance.build();
    return instance;
  }

  private module: Module | null = null;
  private container: Container = new Container();
  private commands: Readonly<Record<string, Command<any>>> = {};
  public commandsList: Readonly<Array<CommandInfo>> = [];

  constructor(
    moduleSource: InstanceModule,
    private readonly logger: Logger,
    public readonly plugins: Plugin[]
  ) {
    super();

    this.module = this.linkModule(moduleSource);
  }

  async build() {
    await this.buildContainer();
    await this.buildCommands();
    await this.buildPlugins();
    this.emit(InstanceEvent.BUILD);
  }

  async execute(name: string, body: any, session = new Session(), params: null | undefined | object) {
    const runner = this.commands[name];
    if (Types.isNull(runner) || Types.isUndefined(runner)) {
      return Result.failure(new InstanceError(`Consumer not found: ${name}`));
    }

    return await runner.run(body, session, params ?? {});
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
    } else {
      return source;
    }
  }
  private combineComponents(module: Module, plugins: Plugin[]) {
    const pluginComponents = plugins.map(it => it.components ?? []).flat();

    return module.components.concat(pluginComponents);
  }

  private async buildContainer() {
    if (Types.isNull(this.module))
      return this.logger.warn('Module is null, skipping container build...');
    const components = this.combineComponents(this.module, this.plugins);

    this.logger.info(`Building container with ${components.length} components...`);
    this.container = await Container.create(components);
  }
  private async buildCommands() {
    const consumers = this.container.components.filter(it => it.type === ComponentType.CONSUMER);

    let handlers: [string | symbol, Command<any>][] = [];
    const schemas = this.module?.schemaRegistry ?? new SchemaRegistry();
    for (const consumer of consumers) {
      const commands = await this.getCommandsFromConsumer(consumer, schemas);
      if (!commands) continue;
      handlers = handlers.concat(commands);
    }
    this.commands = Object.fromEntries(handlers);
    this.logger.info(`Building commands with ${handlers.length} handlers...`);

    Object.freeze(this.commands);
  }

  private async getCommandsFromConsumer(
    consumer: Component,
    schemas: SchemaRegistry
  ): Promise<[string | symbol, Command<any>][] | void> {
    const instance = await this.container.get(consumer);

    if (Types.isFunction(instance)) {
      return [[consumer.name, Command.createFromFunction(instance, consumer.metadata, schemas)]];
    }
    if (Types.isObject(instance)) {
      return Command.createFromObject(instance, consumer.metadata, schemas).map(it => [
        `${consumer.name.toString()}.${it[0]}`,
        it[1],
      ]);
    }
  }

  private async buildPlugins() {
    await Promise.all(this.plugins.map(it => it.build?.(this)));
  }

  private generateCommandsList() {
    const commandsEntries = Object.entries(this.commands);
    const commandsList: CommandInfo[] = new Array<CommandInfo>(commandsEntries.length,);

    for (let i = 0; i < commandsEntries.length; i++) {
      const commandEntire = commandsEntries[i];
      const command = commandEntire[1];

      commandsList[i] = ({
        name: commandEntire[0],
        body: command.body,
        returns: command.returns,
        params: command.params,
        description: command.description,
        metadata: command.metadata,
      });
    }

    Object.freeze(commandsList);

    return commandsList;
  }
}

export { Instance, InstanceEvent, InstanceError };
