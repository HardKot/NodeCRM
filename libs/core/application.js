import * as path from 'node:path';
import { EventEmitter } from 'node:events';

import { Types } from '#utils';

import { Logger } from './logger.js';
import { Config } from './config.js';
import { Container } from './container.js';
import { BeanRegistry } from './beanRegistry.js';
import { PackageManager } from './packageManager.js';
import { SpaceModule } from './spaceModule.js';
import { ApplicationEvent } from './enums.js';
import { CoreError } from './errors.js';

export { Application };

class Application {
  static async base(callback) {
    const app = new Application({});
    await app.prepare(callback);
    await app.build();
    await app.run('default');
    return app;
  }

  constructor({ stdout, stderr, stdin }) {
    this.stdout = stdout;
    this.stdin = stdin;
    this.stderr = stderr;

    this.prefix = `Instance@${path.parse(process.cwd()).base}`;

    this.eventEmitter = new EventEmitter({});
    this.logger = new Logger({ prefix: this.prefix, stdout, stderr });
    this.container = new Container(this);
    this.packages = new PackageManager(this);
    this.beanRegistry = new BeanRegistry(this);
    this.config = new Config(this);
    this.plugins = new Set();
    this.entrypoints = {
      default: () => {
        for (const plugin of this.plugins) {
          if (!plugin.run) continue;
          plugin.run();
        }
      },
    };

    const packageDescription = callback => this.packages.binder(callback);
    packageDescription.loadNodePackages = () => this.packages.loadNodePackages();
    packageDescription.loadNpmPackages = () => this.packages.loadNpmPackages();

    this.description = {
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

  async run(name) {
    if (!Types.isString(name)) {
      return this.logger.error(
        new CoreError(`Application[run] awaiting name is String but get ${typeof name}`)
      );
    }
    const runner = this.entrypoints[name];
    if (!runner) {
      return this.logger.error(new CoreError(`Entrypoint "${name}" not found`));
    }
    try {
      this.eventEmitter.emit(ApplicationEvent.RUN, this, runner);
      await runner();
    } catch (e) {
      this.logger.error(e);
      this.eventEmitter.emit(ApplicationEvent.ERROR, e, this, runner);
    } finally {
      this.eventEmitter.emit(ApplicationEvent.STOP, this, runner);
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
    if (key in this.description) throw new CoreError(`Description "${key}" is used`);
    if (!Types.isFunction(description)) description = () => description;
    this.description[key] = description;
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
}
