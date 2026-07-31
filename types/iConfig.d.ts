declare interface ApplicationConfig { }

declare interface IConfig {
  readonly environment: IConfigEnvironmentValue;
  defaultConfig: Partial<ApplicationConfig>;
  getValue<T>(pathname: string, defaultValue?: T): T;
  loadConfig(): Promise<void>;
}
