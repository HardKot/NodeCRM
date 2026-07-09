declare interface IApplication<Schema> {
  readonly stdout: NodeJS.WriteStream;

  readonly stdin: NodeJS.ReadableStream;
  readonly stderr: NodeJS.WriteStream;

  readonly instanceName: string;
  readonly prefix: string;

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
}
