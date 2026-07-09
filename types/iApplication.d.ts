declare interface IApplication<Schema> {
  readonly stdout: NodeJS.WriteStream;

  readonly stdin: NodeJS.ReadableStream;
  readonly stderr: NodeJS.WriteStream;

  readonly isRunner: boolean;
  readonly isMaster: boolean;

  readonly instanceName: string;
  readonly prerfix: string;

  readonly eventEmitter: NodeJS.EventEmitter;

  readonly logger: ILogger;
  readonly container: IContainer;
  readonly packages: IPackageManager;
  readonly config: IConfig;
  readonly schemas: ISchemaManager<Schema>;

  injectDescription<T>(key: string, description: T | (() => T)): void;
  injectEntrypoint(key: string, runner: Function): void;
  injectPlugin(plugin: ISpaceModule): void;

  commandDescription(): CommandDescription;
  applicationDescription(): IApplicationDescription;

  prepare(callback: (description: IApplicationDescription) => void): void;
  build(): Promise<void>;
  run(): Promise<void>;

  sendMessage(options: { message: string; target: string; sender: string }): void;
  sendMessageAll(options: { message: string; skip?: string; sender: string }): void;
}

declare interface CommandDescription {
  getScope(): string;
  setScope(id: string): void;
  bean<T>(alias: string): Promise<T>;
  node<T>(name: string): T;
  npm<T>(name: string): T;
  config: IConfig['getValue'];
  print: ApplicationPrint;
}
