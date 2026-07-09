import { EventEmitter } from 'node:events';

import { Types } from '#utils';

import { Logger } from '#logger';
import { Container } from '#container';
import { PackageManager } from '#packageManager';
import { Config } from '#config';

import { BaseSchema, SchemaManager } from '#schema';
import { ISpaceModule } from '../core/interfaces/ISpaceModule.ts';
import { ApplicationDescription } from './applicationDescription.ts';
import { ApplicationEvent } from '#constant';

export { Application };

interface ApplicationProps {
  environment: IConfigEnvironmentValue;
  name: string;
  run: string;
}

class Application implements IApplication<BaseSchema> {
  #plugins: Set<ISpaceModule> = new Set();

  readonly stdout: NodeJS.WriteStream;
  readonly stdin: NodeJS.ReadStream;
  readonly stderr: NodeJS.WriteStream;

  readonly isRunner: boolean;
  readonly isMaster: boolean;

  readonly instanceName: string;
  readonly prefix: string;

  readonly eventEmitter: NodeJS.EventEmitter;
  readonly logger: Logger;
  readonly container: Container;
  readonly packages: PackageManager;
  readonly config: Config;
  readonly schemas: SchemaManager;

  #description: ApplicationDescription;

  constructor({ environment, name, run }: ApplicationProps) {
    this.stdout = process.stdout;
    this.stdin = process.stdin;
    this.stderr = process.stderr;

    this.isRunner = !!run;
    this.isMaster = !this.isRunner;

    this.instanceName = name;
    this.prefix = `${this.instanceName}@${run ?? 'Master'}`;

    this.eventEmitter = new EventEmitter({});
    this.logger = new Logger({
      prefix: 'App',
      stdout: this.stdout,
      stderr: this.stderr,
    });
    this.container = new Container();
    this.packages = new PackageManager({ logger: this.logger, exclude: [] });
    this.config = new Config({ environment });
    this.schemas = new SchemaManager();

    this.#description = new ApplicationDescription({
      logger: this.logger,
      eventEmitter: this.eventEmitter,
      app: this,
    });
    this.#plugins = new Set();

    Object.freeze(this);
  }

  injectPlugin(plugin: ISpaceModule): void {
    this.#plugins.add(plugin);
  }

  injectDescription(key: string, description: any): void {
    if (key in this.#description) throw new Error(`Description "${key}" is used`);
    Object.defineProperty(this.#description, key, {
      get: Types.isFunction(description) ? description : () => description,
      enumerable: true,
      configurable: false,
    });
  }

  run() { }

  async build() {
    try {
      this.eventEmitter.emit(ApplicationEvent.BUILD, this);
      await this.container.build();

      const promises = [...this.#plugins].map((it) => it.prepare?.()).filter((it) => it);
      await Promise.all(promises);
    } catch (e) {
      this.logger.error(e);
      this.eventEmitter.emit(ApplicationEvent.ERROR, this, e);
    }
  }

  prepare(callback: (description: IApplicationDescription) => void): void {
    try {
      this.eventEmitter.emit(ApplicationEvent.PREPARE, this);
      const description = this.applicationDescription();
      callback(description);
    } catch (e) {
      this.logger.error(e);
      this.eventEmitter.emit(ApplicationEvent.ERROR, this, e);
    }
  }

  applicationDescription(): IApplicationDescription {
    return new Proxy(this.#description, {
      get(target, key: keyof ApplicationDescription) {
        if (target.isInDescription(key)) return target[key];
        return target.lazyLoad(key);
      },
      set() {
        return false;
      },
      has() {
        return true;
      },
      deleteProperty() {
        return false;
      },
    });
  }

  // async build() {
  //   try {
  //     this.eventEmitter.emit(ApplicationEvent.BUILD, this);
  //     await this.beanRegistry.validate();
  //     await this.container.buildContainer();
  //
  //     const promises = this.plugins
  //       .values()
  //       .map((it) => it.prepare?.())
  //       .filter((it) => it)
  //       .toArray();
  //     await Promise.all(promises);
  //   } catch (e) {
  //     this.logger.error(e);
  //     this.eventEmitter.emit(ApplicationEvent.ERROR, this, e);
  //   }
  // }
  //
  // async run() {
  //   try {
  //     if (this.isMaster) this.runMaster();
  //     if (this.isRunner) this.runRunner();
  //   } catch (e) {
  //     this.logger.error(e);
  //     this.eventEmitter.emit(ApplicationEvent.ERROR, e, this);
  //   } finally {
  //     this.eventEmitter.emit(ApplicationEvent.STOP, this);
  //   }
  // }
  //
  // async linkPlugins(source) {
  //   if (Types.isClass(source)) return this.linkPlugins(new source(this));
  //   if (Types.isAsyncIterator(source)) {
  //     for await (const plugin of source) await this.linkPlugins(plugin);
  //     return;
  //   }
  //   if (Types.isFunction(source)) return this.linkPlugins(source(this));
  //
  //   if (!Types.isObject(source)) throw new CoreError('Awaiting Class, AsyncIterator, Function, Object');
  //   if (Types.isNotInstanceOf(source, SpaceModule))
  //     throw new Error(`Module is not instanceof "SpaceModule", ${source}`);
  //
  //   this.plugins.add(source);
  // }
  //
  // injectDescription(key, description) {
  //   if (!Types.isString(key)) throw new CoreError('Awaiting String');
  //   if (key in this.description) throw new CoreError(`Description "${key}" is used`);
  //
  //   if (!Types.isFunction(description)) description = () => description;
  //   this.description[key] = description;
  // }
  //
  // injectEntrypoint(key, runner) {
  //   if (!Types.isString(key)) throw new CoreError('Awaiting String');
  //   if (!Types.isFunction(runner)) throw new CoreError('Awaiting Function');
  //
  //   if (key in this.entrypoints) throw new CoreError(`Entrypoint "${runner}" is used`);
  //   this.entrypoints[key] = runner;
  // }
  //
  // commandDescription() {
  //   let scopeId = undefined;
  //   return {
  //     setScope: (id) => (scopeId = id),
  //     getScope: () => scopeId,
  //     bean: (alias) => this.container.resolve(alias, scopeId),
  //     node: (name) => this.packages.get(name),
  //     npm: (name) => this.packages.get(name),
  //     config: (key, defaultValue) => this.config.getValue(key, defaultValue),
  //     print: {
  //       log: (...args) => this.logger.log(...args),
  //       info: (...args) => this.logger.info(...args),
  //       warn: (...args) => this.logger.warn(...args),
  //       error: (...args) => this.logger.warn(...args),
  //     },
  //   };
  // }
  //
  //
  // runMaster() {
  //   this.eventEmitter.emit(ApplicationEvent.RUN, this);
  //   for (const key in this.entrypoints) {
  //     this.logger.info(`Run application ${key}`);
  //     // eslint-disable-next-line no-undef
  //     const controller = new AbortController();
  //     const main = process.argv[1];
  //     const child = child_process.fork(main, [`${ApplicationArgs.RUNNER}:${key}`], {
  //       signal: controller.signal,
  //     });
  //
  //     child.on('error', (error) => {
  //       this.logger.error(error);
  //       this.eventEmitter.emit(ApplicationEvent.ERROR, error, this);
  //     });
  //
  //     child.on('exit', (code) => {
  //       if (code !== 0) return this.logger.error(`Runner ${key} exist with error ${code}`);
  //       return this.logger.info(`Runner ${key} exit with code ${code}`);
  //     });
  //
  //     child.on('message', (message) => this.parserChildMessage({ message, child, sender: key }));
  //
  //     this.children[key] = child;
  //   }
  // }
  //
  // runRunner() {
  //   if (!this.runnerName) throw new CoreError('Runner is not defined');
  //   const runner = this.entrypoints[this.runnerName];
  //   if (!runner) throw new CoreError(`Runner "${this.runnerName}" is not defined`);
  //
  //   runner();
  // }
  //
  // parserChildMessage({ message, child, sender }) {
  //   if (!Types.isString(message)) throw new CoreError('Message is not string');
  //   const { command, target, payload } = JSON.parse(message);
  //
  //   if (command === 'kill') return child.kill();
  //   if (command === 'message') {
  //     if (target === 'master') return this.eventEmitter.emit(ApplicationEvent.MESSAGE, payload);
  //     if (target === 'all') return this.sendMessageAll({ message, sender, skip: child });
  //     return this.sendMessage({ message: payload, target, sender });
  //   }
  // }
  //
  // sendMessage({ message, target, sender }) {
  //   this.children[target]?.send(
  //     JSON.stringify({
  //       command: 'message',
  //       sender: sender,
  //       payload: message,
  //     })
  //   );
  // }
  //
  // sendMessageAll({ message, sender, skip }) {
  //   for (const childKey in this.children) {
  //     const child = this.children[childKey];
  //     if (child === skip) continue;
  //     this.sendMessage({
  //       message,
  //       target: childKey,
  //       sender,
  //     });
  //   }
  // }
}
