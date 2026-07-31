import { EventEmitter } from 'node:events';

import { Logger } from '#logger';
import { Container } from '#container';
import { PackageManager } from '#packageManager';
import { Config } from '#config';
import { BaseSchema, SchemaManager } from '#schema';
import { ApplicationEvent } from '#constant';

import { ApplicationDescription } from './applicationDescription.ts';
import { ApplicationEntrypoint } from './applicationEntrypoint.ts';
import { CommandDescription } from './commandDescription.ts';

export { Application };

interface ApplicationProps {
  environment: IConfigEnvironmentValue;
  name: string;
  run: string;
}

class Application implements IApplication<BaseSchema> {
  #plugins: Set<ISpaceModule>;

  readonly stdout: NodeJS.WriteStream;
  readonly stdin: NodeJS.ReadStream;
  readonly stderr: NodeJS.WriteStream;

  readonly instanceName: string;
  readonly prefix: string;
  readonly name: string;

  readonly eventEmitter: NodeJS.EventEmitter;
  readonly logger: Logger;
  readonly container: Container;
  readonly packages: PackageManager;
  readonly config: Config;
  readonly schemas: SchemaManager;

  #description: ApplicationDescription;
  #entrypoints: ApplicationEntrypoint;

  constructor({ environment, name, run }: ApplicationProps) {
    this.stdout = process.stdout;
    this.stdin = process.stdin;
    this.stderr = process.stderr;

    this.instanceName = name;
    this.name = run ?? 'Master';
    this.prefix = `${this.instanceName}@${this.name}`;

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
    this.#entrypoints = new ApplicationEntrypoint();
    this.#plugins = new Set();

    Object.freeze(this);
  }

  injectPlugin(plugin: ISpaceModule): void {
    this.#plugins.add(plugin);
  }

  injectDescription(key: string, description: any): void {
    this.#description.inject(key, description);
  }

  injectEntrypoint(key: string, runner: Function): void {
    this.#entrypoints.inject(key, runner);
  }

  async run() {
    try {
      this.eventEmitter.emit(ApplicationEvent.RUN, this);
      this.logger.info(`Run application ${this.instanceName}`);
      this.#entrypoints.runAll();
    } catch (e) {
      this.logger.error(e);
      this.eventEmitter.emit(ApplicationEvent.ERROR, e, this);
    } finally {
      this.eventEmitter.emit(ApplicationEvent.STOP, this);
    }
  }

  async build() {
    try {
      this.eventEmitter.emit(ApplicationEvent.BUILD, this);
      await this.container.build();
      await Promise.all(
        this.#plugins
          .values()
          .map((it) => it.build?.())
          .filter((it) => it)
      );
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
      this.#plugins.values().forEach((it) => it.prepare?.());
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

  commandDescription(): CommandDescription {
    return new CommandDescription({
      logger: this.logger,
      packageManager: this.packages,
      config: this.config,
      container: this.container,
    });
  }
}
