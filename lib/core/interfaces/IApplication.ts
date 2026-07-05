import type { EventEmitter } from 'node:events';

import type { ILogger } from './ILogger.js';
import type { IContainer } from '../../beans/IContainer.js';
import type { IPackageManager, IPackageBuilder } from './IPackageManager.js';
import type { IBeanBuilder, IBeanRegistry } from '../../beans/interfaces.js';
import type { IConfig } from './IConfig.js';
import type { ISchemaManager } from './ISchemaManager.js';
import type { ISpaceModule } from './ISpaceModule.js';

export type { IApplication, ApplicationDescription, CommandDescription };

interface IApplication {
  readonly stdout: NodeJS.ReadStream;

  readonly stdin: NodeJS.WriteStream;
  readonly stderr: NodeJS.WriteStream;

  readonly isRunner: boolean;
  readonly isMaster: boolean;

  readonly instanceName: string;
  readonly prerfix: string;

  readonly eventEmitter: EventEmitter;
  readonly logger: ILogger;
  readonly container: IContainer;
  readonly packages: IPackageManager;
  readonly beanRegistry: IBeanRegistry;
  readonly config: IConfig;
  readonly schemas: ISchemaManager;

  injectDescription<T>(key: string, description: T | (() => T)): void;
  injectEntrypoint(key: string, runner: Function): void;

  commandDescription(): CommandDescription;
  applicationDescription(): ApplicationDescription;

  prepare(callback: (description: ApplicationDescription) => Promise<void>): Promise<void>;
  build(): Promise<void>;
  run(): Promise<void>;

  sendMessage(options: { message: string; target: string; sender: string }): void;

  sendMessageAll(options: { message: string; skip?: string; sender: string }): void;
}

interface ApplicationPrint {
  readonly log: ILogger['log'];
  readonly info: ILogger['info'];
  readonly warn: ILogger['warn'];
  readonly error: ILogger['error'];
}

interface ApplicationSubscription {
  prepare(callback: (app: IApplication) => void): void;
  run(callback: (app: IApplication) => void): void;
  stop(callback: (app: IApplication) => void): void;
  error(callback: (error: Error, app: IApplication) => void): void;
}

interface ApplicationDescription {
  bean<T>(callback: IBeanBuilder<T>): void;
  package<T>(callback: IPackageBuilder<T>): void;
  loadNodePackages(): void;
  loadNpmPackages(): void;

  plugin(Class: new (app: IApplication) => ISpaceModule): void;
  plugin(factory: (app: IApplication) => ISpaceModule): void;
  plugin(obj: ISpaceModule): void;

  getConfig: IConfig['getValue'];
  print: ApplicationPrint;
  on: ApplicationSubscription;
}

interface CommandDescription {
  getScope(): string;
  setScope(id: string): void;
  bean<T>(alias: string): Promise<T>;
  node<T>(name: string): T;
  npm<T>(name: string): T;
  config: IConfig['getValue'];
  print: ApplicationPrint;
}
