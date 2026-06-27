import * as path from 'node:path';
import * as child_process from 'node:child_process';
import { EventEmitter } from 'node:events';

import { Types } from '#utils';

import { Logger } from './logger.js';
import { Config } from './config.js';
import { Container } from './container.js';
import { BeanRegistry } from './beanRegistry.js';
import { PackageManager } from './packageManager.js';
import { SpaceModule } from './spaceModule.js';
import { ApplicationArgs, ApplicationEvent } from './enums.js';
import { CoreError } from './errors.js';

export { Application };

class Application {
  static async base(callback) {
    const app = new Application({});
    await app.prepare(callback);
    await app.build();
    await app.run();
    return app;
  }

  constructor({ stdout, stderr, stdin }) {
    this.stdout = stdout;
    this.stdin = stdin;
    this.stderr = stderr;

    this.isRunner = !!process.argv[2] && !!process.argv[2]?.includes(`${ApplicationArgs.RUNNER}:`);
    this.isMaster = !this.isRunner;

    if (this.isRunner) this.runnerName = process.argv[2]?.split(':')[1];

    this.instanceName = path.parse(process.cwd()).base;
    this.prefix = `${this.instanceName}@Master`;
    if (this.isRunner) this.prefix = `${this.instanceName}@${this.runnerName}`;

    this.eventEmitter = new EventEmitter({});
    this.logger = new Logger({ prefix: this.prefix, stdout, stderr });
    this.container = new Container(this);
    this.packages = new PackageManager(this);
    this.beanRegistry = new BeanRegistry(this);
    this.config = new Config(this);
    this.plugins = new Set();
    this.children = {};
    this.entrypoints = {};

    this.description = this.applicationDescription();

    Object.freeze(this);
  }

  async prepare(callback) {
    try {
      this.eventEmitter.emit(ApplicationEvent.PREPARE, this);
      const proxy = new Proxy(this.description, {
        get(target, key) {
          if (key in target) return target[key];
          return (...args) => target[key]?.(...args);
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
      await callback(proxy);
    } catch (e) {
      this.logger.error(e);
      this.eventEmitter.emit(ApplicationEvent.ERROR, this, e);
    }
  }

  async build() {
    try {
      this.eventEmitter.emit(ApplicationEvent.BUILD, this);
      await this.beanRegistry.validate();
      await this.container.buildContainer();

      const promises = this.plugins
        .values()
        .map(it => it.prepare?.())
        .filter(it => it)
        .toArray();
      await Promise.all(promises);
    } catch (e) {
      this.logger.error(e);
      this.eventEmitter.emit(ApplicationEvent.ERROR, this, e);
    }
  }

  async run() {
    try {
      if (this.isMaster) this.runMaster();
      if (this.isRunner) this.runRunner();
    } catch (e) {
      this.logger.error(e);
      this.eventEmitter.emit(ApplicationEvent.ERROR, e, this);
    } finally {
      this.eventEmitter.emit(ApplicationEvent.STOP, this);
    }
  }

  async linkPlugins(source) {
    if (Types.isClass(source)) return this.linkPlugins(new source(this));
    if (Types.isAsyncIterator(source)) {
      for await (const plugin of source) await this.linkPlugins(plugin);
      return;
    }
    if (Types.isFunction(source)) return this.linkPlugins(source(this));

    if (!Types.isObject(source))
      throw new CoreError('Awaiting Class, AsyncIterator, Function, Object');
    if (Types.isNotInstanceOf(source, SpaceModule))
      throw new Error(`Module is not instanceof "SpaceModule", ${source}`);

    this.plugins.add(source);
  }

  injectDescription(key, description) {
    if (!Types.isString(key)) throw new CoreError('Awaiting String');
    if (key in this.description) throw new CoreError(`Description "${key}" is used`);

    if (!Types.isFunction(description)) description = () => description;
    this.description[key] = description;
  }

  injectEntrypoint(key, runner) {
    if (!Types.isString(key)) throw new CoreError('Awaiting String');
    if (!Types.isFunction(runner)) throw new CoreError('Awaiting Function');

    if (key in this.entrypoints) throw new CoreError(`Entrypoint "${runner}" is used`);
    this.entrypoints[key] = runner;
  }

  commandDescription() {
    let scopeId = undefined;
    return {
      setScope: id => (scopeId = id),
      getScope: () => scopeId,
      bean: alias => this.container.resolve(alias, scopeId),
      node: name => this.packages.get(name),
      npm: name => this.packages.get(name),
      config: (key, defaultValue) => this.config.getValue(key, defaultValue),
      print: {
        log: (...args) => this.logger.log(...args),
        info: (...args) => this.logger.info(...args),
        warn: (...args) => this.logger.warn(...args),
        error: (...args) => this.logger.warn(...args),
      },
    };
  }

  applicationDescription() {
    const packageDescription = callback => this.packages.binder(callback);
    packageDescription.loadNodePackages = () => this.packages.loadNodePackages();
    packageDescription.loadNpmPackages = () => this.packages.loadNpmPackages();

    return {
      bean: callback => this.beanRegistry.binder(callback),
      package: packageDescription,
      config: () => ({
        get: (...args) => this.config.getValue(...args),
      }),
      plugin: plugin => this.linkPlugins(plugin),
      on: () => ({
        prepare: callback => this.eventEmitter.on(ApplicationEvent.PREPARE, callback),
        run: callback => this.eventEmitter.on(ApplicationEvent.RUN, callback),
        error: callback => this.eventEmitter.on(ApplicationEvent.ERROR, callback),
        stop: callback => this.eventEmitter.on(ApplicationEvent.STOP, callback),
      }),
      print: () => ({
        log: (...args) => this.logger.log(...args),
        info: (...args) => this.logger.info(...args),
        warn: (...args) => this.logger.warn(...args),
        error: (...args) => this.logger.warn(...args),
      }),
    };
  }

  runMaster() {
    this.eventEmitter.emit(ApplicationEvent.RUN, this);
    for (const key in this.entrypoints) {
      this.logger.info(`Run application ${key}`);
      // eslint-disable-next-line no-undef
      const controller = new AbortController();
      const main = process.argv[1];
      const child = child_process.fork(main, [`${ApplicationArgs.RUNNER}:${key}`], {
        signal: controller.signal,
      });

      child.on('error', error => {
        this.logger.error(error);
        this.eventEmitter.emit(ApplicationEvent.ERROR, error, this);
      });

      child.on('exit', code => {
        if (code !== 0) return this.logger.error(`Runner ${key} exist with error ${code}`);
        return this.logger.info(`Runner ${key} exit with code ${code}`);
      });

      child.on('message', message => this.parserChildMessage({ message, child, sender: key }));

      this.children[key] = child;
    }
  }

  runRunner() {
    if (!this.runnerName) throw new CoreError('Runner is not defined');
    const runner = this.entrypoints[this.runnerName];
    if (!runner) throw new CoreError(`Runner "${this.runnerName}" is not defined`);

    runner();
  }

  parserChildMessage({ message, child, sender }) {
    if (!Types.isString(message)) throw new CoreError('Message is not string');
    const { command, target, payload } = JSON.parse(message);

    if (command === 'kill') return child.kill();
    if (command === 'message') {
      if (target === 'master') return this.eventEmitter.emit(ApplicationEvent.MESSAGE, payload);
      if (target === 'all') return this.sendMessageAll({ message, sender, skip: child });
      return this.sendMessage({ message: payload, target, sender });
    }
  }

  sendMessage({ message, target, sender }) {
    this.children[target]?.send(
      JSON.stringify({
        command: 'message',
        sender: sender,
        payload: message,
      })
    );
  }

  sendMessageAll({ message, sender, skip }) {
    for (const childKey in this.children) {
      const child = this.children[childKey];
      if (child === skip) continue;
      this.sendMessage({
        message,
        target: childKey,
        sender,
      });
    }
  }
}
