export type { IConfig };

interface IConfig {
  getValue<T>(pathname: string, defaultValue?: T): T;
}
