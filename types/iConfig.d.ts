interface IConfig {
  readonly environment: IConfigEnvironmentValue;
  getValue<T>(pathname: string, defaultValue?: T): T;
  loadConfig(): Promise<void>;
}
