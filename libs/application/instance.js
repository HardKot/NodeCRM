const { Container } = require('./container');
const { ComponentType } = require('../core');
const { EventEmitter } = require('node:events');
const { Command } = require('./command');
const { Result, Types } = require('../utils');
const { Session } = require('../security');
const { SchemaRegistry } = require('../schema');
const { defultComponents } = require('./defultComponents');
const InstanceEvent = Object.freeze({
    BUILD: 'build',
    UPDATE: 'update',
});
class InstanceError extends Error {
}
class Instance extends EventEmitter {
    logger;
    plugins;
    static async create(moduleSource, logger, plugins = []) {
        if (Types.isPromise(moduleSource)) {
            moduleSource = await moduleSource;
        }
        const instance = new Instance(moduleSource, logger, plugins);
        await instance.build();
        await instance.run();
        return instance;
    }
    module = null;
    container = new Container();
    commands = {};
    commandsList = [];
    constructor(moduleSource, logger, plugins) {
        super();
        this.logger = logger;
        this.plugins = plugins;
        this.module = this.linkModule(moduleSource);
    }
    async build() {
        await this.buildContainer();
        await this.buildCommands();
        await this.buildPlugins();
        this.emit(InstanceEvent.BUILD);
    }
    async execute(name, body, session = new Session(), params) {
        const runner = this.commands[name];
        if (Types.isNull(runner) || Types.isUndefined(runner)) {
            return Result.failure(new InstanceError(`Consumer not found: ${name}`));
        }
        return await runner.run(body, session ?? undefined, params ?? {});
    }
    async getProvider(token) {
        return this.container.get(token);
    }
    async run() {
        this.logger.info('Instance is running...');
        await Promise.all(this.plugins.map(it => it.init?.(this)));
    }
    async subscribeToModuleChanges(source) {
        for await (const module of source) {
            this.module = this.linkModule(module);
        }
    }
    linkModule(source) {
        if (Types.isAsyncIterator(source)) {
            this.subscribeToModuleChanges(source).catch((err) => this.logger.error(err));
            return null;
        }
        else {
            return source;
        }
    }
    combineComponents(module, plugins) {
        const pluginComponents = plugins.map(it => it.components ?? []).flat();
        return module.components.concat(pluginComponents, defultComponents);
    }
    async buildContainer() {
        if (Types.isNull(this.module))
            return this.logger.warn('Module is null, skipping container build...');
        const components = this.combineComponents(this.module, this.plugins);
        this.logger.info(`Building container with ${components.length} components...`);
        this.container = await Container.create(components);
    }
    async buildCommands() {
        const consumers = this.container.components.filter(it => it.type === ComponentType.CONSUMER);
        let handlers = [];
        const schemas = this.module?.schemaRegistry ?? new SchemaRegistry();
        for (const consumer of consumers) {
            const commands = await this.getCommandsFromConsumer(consumer, schemas);
            if (!commands)
                continue;
            handlers = handlers.concat(commands);
        }
        this.commands = Object.fromEntries(handlers);
        this.commandsList = this.generateCommandsList();
        this.logger.info(`Building commands with ${handlers.length} handlers...`);
        Object.freeze(this.commands);
        Object.freeze(this.commandsList);
    }
    async getCommandsFromConsumer(consumer, schemas) {
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
    async buildPlugins() {
        await Promise.all(this.plugins.map(it => it.build?.(this)));
    }
    generateCommandsList() {
        const commandsEntries = Object.entries(this.commands);
        const commandsList = new Array(commandsEntries.length);
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

exports.Instance = Instance;
exports.InstanceEvent = InstanceEvent;
exports.InstanceError = InstanceError;